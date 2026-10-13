import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';
import { TransactionType, TransactionStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { creditCardId, transactions, bankOrIssuer } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação para importar' }, { status: 400 });
    }

    // Se não passou creditCardId ou se o cartão não existir, buscar ou criar automaticamente
    let card = null;
    if (creditCardId) {
      card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
    }

    if (!card) {
      // Tenta achar qualquer cartão existente
      card = await prisma.creditCard.findFirst();
    }

    // Se ainda não existir cartão no banco, cria automaticamente com base no emissor da fatura
    if (!card) {
      const cardName = bankOrIssuer && bankOrIssuer !== 'Fatura de Cartão' ? bankOrIssuer : 'Cartão Principal';
      card = await prisma.creditCard.create({
        data: {
          name: cardName,
          creditLimit: 300000, // 3000 reais padrão
          closingDay: 15,
          dueDay: 25,
        },
      });
    }

    const resolvedCardId = card.id;
    const finishedDebts: Array<{ description: string; totalInstallments: number }> = [];

    // Executa a gravação dos lançamentos
    for (const item of transactions) {
      const itemDate = new Date(item.date);
      const amountCents = item.amount;
      const curInst = item.installmentCurrent;
      const totInst = item.installmentTotal;

      // 1. Verificar se é uma compra parcelada que acabou (ex: 10 de 10 ou 2 de 2)
      if (curInst && totInst && curInst >= totInst) {
        finishedDebts.push({
          description: item.description,
          totalInstallments: totInst,
        });
      }

      // 2. Se for parcelamento em andamento (ex: 2 de 3), cadastra dívida futura
      if (curInst && totInst && curInst < totInst) {
        const nextMonthDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, card.dueDay);
        const remainingCount = totInst - curInst;
        const nextInstallmentNumber = curInst + 1;

        await prisma.debtLoan.create({
          data: {
            title: `${item.description} (Parcela ${nextInstallmentNumber}/${totInst})`,
            personName: `${card.name}`,
            isToReceive: false,
            originalAmount: amountCents * remainingCount,
            remainingAmount: amountCents,
            dueDate: nextMonthDate,
            description: `Parcela futura gerada pela fatura. Faltam ${remainingCount} parcelas.`,
          },
        });
      }

      // 3. Cadastrar ou encontrar a fatura no banco
      const txMonth = itemDate.getMonth() + 1;
      const txYear = itemDate.getFullYear();

      let invoice = await prisma.invoice.findUnique({
        where: {
          creditCardId_month_year: {
            creditCardId: resolvedCardId,
            month: txMonth,
            year: txYear,
          },
        },
      });

      if (!invoice) {
        const closingDate = new Date(txYear, txMonth - 1, card.closingDay);
        const dueDate = new Date(txYear, txMonth - 1, card.dueDay);
        invoice = await prisma.invoice.create({
          data: {
            creditCardId: resolvedCardId,
            month: txMonth,
            year: txYear,
            closingDate,
            dueDate,
            totalAmount: amountCents,
          },
        });
      } else {
        invoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { totalAmount: { increment: amountCents } },
        });
      }

      const notesContent = item.tag
        ? `[Tag/Observação: ${item.tag}] • Fatura ${bankOrIssuer || card.name}`
        : `Fatura ${bankOrIssuer || card.name}`;

      await prisma.transaction.create({
        data: {
          description: item.description,
          amount: amountCents,
          date: itemDate,
          type: TransactionType.CREDIT_CARD_EXPENSE,
          status: TransactionStatus.COMPLETED,
          paymentMethod: 'Crédito',
          creditCardId: resolvedCardId,
          invoiceId: invoice.id,
          currentInstallment: curInst || null,
          totalInstallments: totInst || null,
          notes: notesContent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: transactions.length,
      finishedDebts,
      cardName: card.name,
    });
  } catch (error: any) {
    console.error('Erro na confirmação da fatura:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar fatura' }, { status: 500 });
  }
}
