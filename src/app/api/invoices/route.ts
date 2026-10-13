import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    const where: any = {};
    if (cardId) where.creditCardId = cardId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        creditCard: true,
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, tag, description } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId obrigatório' }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        notes: tag ? `[Tag: ${tag}]` : tx.notes,
        description: description || tx.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
