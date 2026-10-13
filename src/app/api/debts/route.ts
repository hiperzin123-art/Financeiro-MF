import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';

export async function GET() {
  try {
    const debts = await prisma.debtLoan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(debts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, personName, isToReceive, amount, dueDate, description } = body;

    const amountInCents = typeof amount === 'number' ? amount : parseBRLToCents(amount);

    const debt = await prisma.debtLoan.create({
      data: {
        title,
        personName,
        isToReceive: !!isToReceive,
        originalAmount: amountInCents,
        remainingAmount: amountInCents,
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
