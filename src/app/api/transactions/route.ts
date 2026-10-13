import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';
import { TransactionType, TransactionStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const categoryId = searchParams.get('categoryId');
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type');

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
        destinationAccount: true,
        creditCard: true,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      description,
      amount, // pode vir em string (R$ 10,00) ou número em centavos
      date,
      type,
      categoryId,
      accountId,
      destinationAccountId,
      creditCardId,
      paymentMethod,
      notes,
      relatedPerson,
    } = body;

    const amountInCents = typeof amount === 'number' && Number.isInteger(amount) ? amount : parseBRLToCents(amount);

    if (!description || !amountInCents || !type) {
      return NextResponse.json({ error: 'Descrição, valor e tipo são obrigatórios.' }, { status: 400 });
    }

    const txDate = date ? new Date(date) : new Date();

    // Executar transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar transação
      const newTx = await tx.transaction.create({
        data: {
          description,
          amount: amountInCents,
          date: txDate,
          type: type as TransactionType,
          status: TransactionStatus.COMPLETED,
          paymentMethod: paymentMethod || 'Outro',
          notes,
          relatedPerson,
          categoryId: categoryId || null,
          accountId: accountId || null,
          destinationAccountId: destinationAccountId || null,
          creditCardId: creditCardId || null,
        },
        include: {
          category: true,
          account: true,
          creditCard: true,
        },
      });

      // 2. Atualizar saldos das contas conforme as regras financeiras
      if (accountId) {
        if (type === TransactionType.EXPENSE || type === TransactionType.INVOICE_PAYMENT || type === TransactionType.DEBT_PAYMENT || type === TransactionType.LOAN_GIVEN) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: { decrement: amountInCents } },
          });
        } else if (type === TransactionType.INCOME || type === TransactionType.LOAN_RECEIVED || type === TransactionType.REIMBURSEMENT) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: { increment: amountInCents } },
          });
        } else if (type === TransactionType.BALANCE_ADJUSTMENT) {
          await tx.account.update({
            where: { id: accountId },
            data: { currentBalance: amountInCents },
          });
        }
      }

      // 3. Regra de Transferência
      if (type === TransactionType.TRANSFER && accountId && destinationAccountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: amountInCents } },
        });
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { currentBalance: { increment: amountInCents } },
        });
      }

      // 4. Regra de compra no cartão de crédito
      if (type === TransactionType.CREDIT_CARD_EXPENSE && creditCardId) {
        // Encontra ou cria a fatura em aberto para o cartão
        const card = await tx.creditCard.findUnique({ where: { id: creditCardId } });
        if (card) {
          const txMonth = txDate.getMonth() + 1;
          const txYear = txDate.getFullYear();

          let invoice = await tx.invoice.findUnique({
            where: {
              creditCardId_month_year: {
                creditCardId,
                month: txMonth,
                year: txYear,
              },
            },
          });

          if (!invoice) {
            const closingDate = new Date(txYear, txMonth - 1, card.closingDay);
            const dueDate = new Date(txYear, txMonth - 1, card.dueDay);
            invoice = await tx.invoice.create({
              data: {
                creditCardId,
                month: txMonth,
                year: txYear,
                closingDate,
                dueDate,
                totalAmount: amountInCents,
              },
            });
          } else {
            invoice = await tx.invoice.update({
              where: { id: invoice.id },
              data: { totalAmount: { increment: amountInCents } },
            });
          }

          // Vincular transação à fatura
          await tx.transaction.update({
            where: { id: newTx.id },
            data: { invoiceId: invoice.id },
          });
        }
      }

      return newTx;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar transação' }, { status: 500 });
  }
}
