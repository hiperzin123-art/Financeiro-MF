import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFinancialMetrics } from '@/lib/financialEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this_month'; // 'today', 'this_week', 'this_month', 'all'
    
    // Calcular range de datas
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Último dia do mês

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === 'all') {
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2099, 11, 31);
    }

    // Carregar entidades reais do banco
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const creditCards = await prisma.creditCard.findMany({
      where: { isActive: true },
      include: {
        invoices: {
          where: { isPaid: false },
        },
      },
      orderBy: { name: 'asc' },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        account: true,
        creditCard: true,
      },
      orderBy: { date: 'desc' },
    });

    const openInvoices = await prisma.invoice.findMany({
      where: { isPaid: false },
    });

    const pendingPayables = await prisma.bill.findMany({
      where: { type: 'PAYABLE', isPaid: false },
    });

    const pendingReceivables = await prisma.bill.findMany({
      where: { type: 'RECEIVABLE', isPaid: false },
    });

    const debtsToPay = await prisma.debtLoan.findMany({
      where: { isToReceive: false, isSettled: false },
    });

    const debtsToReceive = await prisma.debtLoan.findMany({
      where: { isToReceive: true, isSettled: false },
    });

    const installmentPlans = await prisma.installmentPlan.findMany({
      include: {
        transactions: true,
      },
    });

    // Calcular parcelas futuras
    const futureInstallments = installmentPlans.map((p) => {
      const paidCount = p.transactions.length;
      const remainingCount = Math.max(0, p.installmentCount - paidCount);
      return {
        amountPerInstallment: p.amountPerInstallment,
        remainingCount,
      };
    });

    // Executar motor financeiro central com precisão decimal/inteira
    const metrics = calculateFinancialMetrics({
      accounts,
      transactions,
      openInvoices,
      pendingPayables,
      pendingReceivables,
      debtsToPay,
      debtsToReceive,
      futureInstallments,
    });

    // Gastos agrupados por categoria
    const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
    for (const tx of transactions) {
      if ((tx.type === 'EXPENSE' || tx.type === 'CREDIT_CARD_EXPENSE') && tx.status !== 'CANCELLED') {
        const catName = tx.category?.name || 'Sem Categoria';
        const catColor = tx.category?.color || '#94a3b8';
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, color: catColor, amount: 0 };
        }
        categoryTotals[catName].amount += tx.amount;
      }
    }

    const expensesByCategory = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      metrics,
      accounts,
      creditCards,
      recentTransactions: transactions.slice(0, 10),
      expensesByCategory,
      period,
    });
  } catch (error: any) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
