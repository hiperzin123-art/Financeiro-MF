import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseBRLToCents } from '@/lib/financialEngine';

export async function GET() {
  try {
    const cards = await prisma.creditCard.findMany({
      include: {
        invoices: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(cards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const limitInCents =
      typeof body.creditLimit === 'number'
        ? body.creditLimit
        : parseBRLToCents(body.creditLimit || 0);

    const card = await prisma.creditCard.create({
      data: {
        name: body.name,
        brand: body.brand || 'OUTRO',
        color: body.color || '#6366f1',
        creditLimit: limitInCents,
        closingDay: parseInt(body.closingDay) || 1,
        dueDay: parseInt(body.dueDay) || 10,
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do cartão não informado' }, { status: 400 });
    }

    // Excluir ou desativar em cascata
    await prisma.creditCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Cartão excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
