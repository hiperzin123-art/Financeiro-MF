import { NextResponse } from 'next/server';
import { parseNaturalCommand } from '@/lib/nlpParser';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    const parsed = parseNaturalCommand(text);
    if (!parsed) {
      return NextResponse.json({ error: 'Não foi possível interpretar o comando' }, { status: 422 });
    }

    // Tentar resolver Category ID e Account/Card ID
    let category = null;
    if (parsed.categoryGuess) {
      category = await prisma.category.findFirst({
        where: { name: { contains: parsed.categoryGuess } },
      });
    }

    let creditCard = null;
    if (parsed.cardGuess) {
      creditCard = await prisma.creditCard.findFirst({
        where: { name: { contains: parsed.cardGuess } },
      });
    }

    const defaultAccount = await prisma.account.findFirst({
      where: { isActive: true },
      orderBy: { currentBalance: 'desc' },
    });

    return NextResponse.json({
      parsed,
      suggestedCategoryId: category?.id,
      suggestedAccountId: defaultAccount?.id,
      suggestedCreditCardId: creditCard?.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
