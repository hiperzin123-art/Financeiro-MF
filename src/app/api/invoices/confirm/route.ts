import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { creditCardId, transactions, bankOrIssuer, invoiceMonth, invoiceYear } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação para importar' }, { status: 400 });
    }

    // Se não passou creditCardId ou se o cartão não existir, buscar ou criar automaticamente
    let card = null;
    if (creditCardId) {
      card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
    }

    if (!card) {
      card = await prisma.creditCard.findFirst();
    }

    if (!card) {
      const cardName = bankOrIssuer && bankOrIssuer !== 'Fatura de Cartão' ? bankOrIssuer : 'Cartão Principal';
      card = await prisma.creditCard.create({
        data: {
          name: cardName,
          creditLimit: 300000,
          closingDay: 15,
          dueDay: 25,
        },
      });
    }

    const resolvedCardId = card.id;

    // Determinar mês e ano de referência da fatura importada (não dividir a fatura em meses diferentes!)
    let refMonth = invoiceMonth ? parseInt(invoiceMonth, 10) : null;
    let refYear = invoiceYear ? parseInt(invoiceYear, 10) : null;

    if (!refMonth || !refYear) {
      const monthCounts: Record<string, number> = {};
      for (const t of transactions) {
        if (t.date) {
          const parts = t.date.split('-');
          if (parts.length >= 2) {
            const k = `${parts[0]}-${parts[1]}`;
            monthCounts[k] = (monthCounts[k] || 0) + 1;
          }
        }
      }
      const best = Object.keys(monthCounts).sort((a, b) => monthCounts[b] - monthCounts[a])[0];
      if (best) {
        const [y, m] = best.split('-');
        refYear = parseInt(y, 10);
        refMonth = parseInt(m, 10);
      } else {
        const now = new Date();
        refYear = now.getFullYear();
        refMonth = now.getMonth() + 1;
      }
    }

    // Buscar ou criar a fatura principal do mês de referência
    const closingDate = new Date(refYear, refMonth - 1, card.closingDay);
    const dueDate = new Date(refYear, refMonth - 1, card.dueDay);

    let currentInvoice = await prisma.invoice.findUnique({
      where: {
        creditCardId_month_year: {
          creditCardId: resolvedCardId,
          month: refMonth,
          year: refYear,
        },
      },
    });

    if (!currentInvoice) {
      currentInvoice = await prisma.invoice.create({
        data: {
          creditCardId: resolvedCardId,
          month: refMonth,
          year: refYear,
          closingDate,
          dueDate,
          totalAmount: 0,
        },
      });
    }

    let currentInvoiceTotalIncrement = 0;
    const finishedDebts: Array<{ description: string; totalInstallments: number }> = [];
    let futureInstallmentsCount = 0;

    // Processar todas as transações da fatura atual
    for (const item of transactions) {
      const itemDate = new Date(item.date);
      const amountCents = item.amount;
      const curInst = item.installmentCurrent ? parseInt(item.installmentCurrent, 10) : null;
      const totInst = item.installmentTotal ? parseInt(item.installmentTotal, 10) : null;

      currentInvoiceTotalIncrement += amountCents;

      // 1. Gravar na fatura principal
      const notesContent = item.tag
        ? `[Tag: ${item.tag}] • Fatura ${bankOrIssuer || card.name}`
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
          invoiceId: currentInvoice.id,
          currentInstallment: curInst,
          totalInstallments: totInst,
          notes: notesContent,
        },
      });

      // 2. Verificar se o parcelamento finalizou nesta fatura (ex: 10 de 10)
      if (curInst && totInst && curInst >= totInst) {
        finishedDebts.push({
          description: item.description,
          totalInstallments: totInst,
        });
      }

      // 3. SE FOR UMA COMPRA PARCELADA EM ANDAMENTO (ex: 5 de 10),
      // CRIAR AS PRÓXIMAS FATURAS MENSAIS COM AS PARCELAS FUTURAS (6/10, 7/10... 10/10)
      if (curInst && totInst && curInst < totInst) {
        for (let i = curInst + 1; i <= totInst; i++) {
          const offset = i - curInst;
          const futureDate = new Date(refYear, refMonth - 1 + offset, 1);
          const futureMonth = futureDate.getMonth() + 1;
          const futureYear = futureDate.getFullYear();

          const futureClosing = new Date(futureYear, futureMonth - 1, card.closingDay);
          const futureDue = new Date(futureYear, futureMonth - 1, card.dueDay);

          let futureInvoice = await prisma.invoice.findUnique({
            where: {
              creditCardId_month_year: {
                creditCardId: resolvedCardId,
                month: futureMonth,
                year: futureYear,
              },
            },
          });

          if (!futureInvoice) {
            futureInvoice = await prisma.invoice.create({
              data: {
                creditCardId: resolvedCardId,
                month: futureMonth,
                year: futureYear,
                closingDate: futureClosing,
                dueDate: futureDue,
                totalAmount: amountCents,
              },
            });
          } else {
            futureInvoice = await prisma.invoice.update({
              where: { id: futureInvoice.id },
              data: { totalAmount: { increment: amountCents } },
            });
          }

          // Descrição limpa para próximas parcelas (ex: "Somadeiras (Parcela 6/10)")
          const cleanDesc = item.description.replace(/(?:parcela\s+)?\d{1,2}\s*(?:de|\/)\s*\d{1,2}/gi, '').trim();
          const futureTitle = `${cleanDesc || item.description} (Parcela ${i}/${totInst})`;

          await prisma.transaction.create({
            data: {
              description: futureTitle,
              amount: amountCents,
              date: futureDue,
              type: TransactionType.CREDIT_CARD_EXPENSE,
              status: TransactionStatus.PENDING,
              paymentMethod: 'Crédito',
              creditCardId: resolvedCardId,
              invoiceId: futureInvoice.id,
              currentInstallment: i,
              totalInstallments: totInst,
              notes: item.tag
                ? `[Tag: ${item.tag}] • Parcela futura agendada (${i}/${totInst}) • Fatura ${bankOrIssuer || card.name}`
                : `Parcela futura agendada (${i}/${totInst}) • Fatura ${bankOrIssuer || card.name}`,
            },
          });

          futureInstallmentsCount++;
        }
      }
    }

    // Atualizar o total da fatura principal
    await prisma.invoice.update({
      where: { id: currentInvoice.id },
      data: { totalAmount: { increment: currentInvoiceTotalIncrement } },
    });

    return NextResponse.json({
      success: true,
      importedCount: transactions.length,
      referenceMonth: refMonth,
      referenceYear: refYear,
      futureInstallmentsCount,
      finishedDebts,
      cardName: card.name,
    });
  } catch (error: any) {
    console.error('Erro na confirmação da fatura:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar fatura' }, { status: 500 });
  }
}
