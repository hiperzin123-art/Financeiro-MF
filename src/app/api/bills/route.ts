import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // PAYABLE ou RECEIVABLE

    const where: any = {};
    if (type) where.type = type;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(bills);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, dueDate, type, isFixed, recurrence, categoryId, accountId, notes } = body;

    const amountInCents = typeof amount === 'number' ? amount : parseBRLToCents(amount);

    const bill = await prisma.bill.create({
      data: {
        title,
        amount: amountInCents,
        dueDate: new Date(dueDate),
        type: type || 'PAYABLE',
        isFixed: !!isFixed,
        recurrence: recurrence || 'NONE',
        categoryId: categoryId || null,
        accountId: accountId || null,
        notes,
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isPaid } = body;

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.bill.update({
        where: { id },
        data: {
          isPaid,
          paidAt: isPaid ? new Date() : null,
        },
      });

      // Se foi marcada como paga e tem conta vinculada, debita ou credita
      if (b.accountId && isPaid) {
        if (b.type === 'PAYABLE') {
          await tx.account.update({
            where: { id: b.accountId },
            data: { currentBalance: { decrement: b.amount } },
          });
        } else {
          await tx.account.update({
            where: { id: b.accountId },
            data: { currentBalance: { increment: b.amount } },
          });
        }
      }

      return b;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
