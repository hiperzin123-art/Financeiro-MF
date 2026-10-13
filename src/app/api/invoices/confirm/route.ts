import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';
import { TransactionType, TransactionStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creditCardId, transactions, bankOrIssuer } = body;

    if (!creditCardId || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Cartão e transações são obrigatórios' }, { status: 400 });
    }

    const card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
    if (!card) return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });

    const finishedDebts: Array<{ description: string; totalInstallments: number }> = [];

    // Executa atomicamente a gravação de todos os lançamentos
    await prisma.$transaction(async (tx) => {
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

        // 2. Se for parcelamento em andamento (ex: 2 de 3, ou seja, curInst < totInst),
        // cadastra a dívida/compromisso para o próximo mês!
        if (curInst && totInst && curInst < totInst) {
          // Criar data de vencimento do próximo mês baseada no dia de vencimento do cartão
          const nextMonthDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, card.dueDay);
          const remainingCount = totInst - curInst;
          const nextInstallmentNumber = curInst + 1;

          await tx.debtLoan.create({
            data: {
              title: `${item.description} (Parcela ${nextInstallmentNumber}/${totInst})`,
              personName: `${card.name}`,
              isToReceive: false, // É dívida a pagar
              originalAmount: amountCents * remainingCount,
              remainingAmount: amountCents, // Valor da próxima parcela
              dueDate: nextMonthDate,
              description: `Parcela futura gerada automaticamente pela fatura do cartão. Faltam ${remainingCount} parcelas.`,
            },
          });
        }

        // 3. Cadastrar o lançamento no cartão
        const txMonth = itemDate.getMonth() + 1;
        const txYear = itemDate.getFullYear();

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
              totalAmount: amountCents,
            },
          });
        } else {
          invoice = await tx.invoice.update({
            where: { id: invoice.id },
            data: { totalAmount: { increment: amountCents } },
          });
        }

        const notesContent = item.tag
          ? `[Tag/Observação: ${item.tag}] • Fatura ${bankOrIssuer || card.name}`
          : `Fatura ${bankOrIssuer || card.name}`;

        await tx.transaction.create({
          data: {
            description: item.description,
            amount: amountCents,
            date: itemDate,
            type: TransactionType.CREDIT_CARD_EXPENSE,
            status: TransactionStatus.COMPLETED,
            paymentMethod: 'Crédito',
            creditCardId,
            invoiceId: invoice.id,
            currentInstallment: curInst || null,
            totalInstallments: totInst || null,
            notes: notesContent,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      importedCount: transactions.length,
      finishedDebts,
    });
  } catch (error: any) {
    console.error('Erro na confirmação da fatura:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar fatura' }, { status: 500 });
  }
}
