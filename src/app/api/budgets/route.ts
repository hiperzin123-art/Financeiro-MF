import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';

export async function GET() {
  try {
    const goals = await prisma.financialGoal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const budgets = await prisma.budget.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ goals, budgets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'goal') {
      const { title, targetAmount, currentAmount, deadline } = body;
      const goal = await prisma.financialGoal.create({
        data: {
          title,
          targetAmount: parseBRLToCents(targetAmount),
          currentAmount: parseBRLToCents(currentAmount || 0),
          deadline: deadline ? new Date(deadline) : null,
        },
      });
      return NextResponse.json(goal, { status: 201 });
    } else {
      const { categoryId, amountLimit, month, year } = body;
      const budget = await prisma.budget.create({
        data: {
          categoryId,
          amountLimit: parseBRLToCents(amountLimit),
          month: month || new Date().getMonth() + 1,
          year: year || new Date().getFullYear(),
        },
      });
      return NextResponse.json(budget, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
