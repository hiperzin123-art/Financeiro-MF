import { PrismaClient, AccountType, CardBrand, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Banco de Dados ---');

  // 1. Criar Categorias padrão
  const categoriesData = [
    { name: 'Alimentação', color: '#f59e0b', icon: 'Utensils', isExpense: true, isIncome: false },
    { name: 'Moradia', color: '#3b82f6', icon: 'Home', isExpense: true, isIncome: false },
    { name: 'Transporte', color: '#6366f1', icon: 'Car', isExpense: true, isIncome: false },
    { name: 'Saúde', color: '#ef4444', icon: 'Heart', isExpense: true, isIncome: false },
    { name: 'Lazer & Cultura', color: '#8b5cf6', icon: 'Smile', isExpense: true, isIncome: false },
    { name: 'Educação', color: '#10b981', icon: 'BookOpen', isExpense: true, isIncome: false },
    { name: 'Salário & Remuneração', color: '#10b981', icon: 'Banknote', isExpense: false, isIncome: true },
    { name: 'Investimentos & Rendimentos', color: '#06b6d4', icon: 'TrendingUp', isExpense: false, isIncome: true },
    { name: 'Outras Entradas', color: '#84cc16', icon: 'PlusCircle', isExpense: false, isIncome: true },
    { name: 'Assinaturas & Serviços', color: '#ec4899', icon: 'Layers', isExpense: true, isIncome: false },
    { name: 'Outros Gastos', color: '#64748b', icon: 'MoreHorizontal', isExpense: true, isIncome: false },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // 2. Criar Contas padrão (se não existirem)
  const existingAccounts = await prisma.account.count();
  if (existingAccounts === 0) {
    const accCorrente = await prisma.account.create({
      data: {
        name: 'Conta Corrente Principal',
        type: AccountType.CHECKING,
        color: '#10b981',
        initialBalance: 350000, // R$ 3.500,00
        currentBalance: 350000,
      },
    });

    const accEspecie = await prisma.account.create({
      data: {
        name: 'Dinheiro Físico (Carteira)',
        type: AccountType.CASH,
        color: '#84cc16',
        initialBalance: 24000, // R$ 240,00
        currentBalance: 24000,
      },
    });

    const accPoupanca = await prisma.account.create({
      data: {
        name: 'Reserva de Emergência',
        type: AccountType.SAVINGS,
        color: '#3b82f6',
        initialBalance: 1200000, // R$ 12.000,00
        currentBalance: 1200000,
      },
    });

    console.log('Contas criadas com sucesso.');
  }

  // 3. Criar Cartões padrão
  const existingCards = await prisma.creditCard.count();
  if (existingCards === 0) {
    await prisma.creditCard.create({
      data: {
        name: 'Nubank Roxinho',
        brand: CardBrand.NUBANK,
        color: '#8b5cf6',
        creditLimit: 500000, // R$ 5.000,00
        closingDay: 28,
        dueDay: 5,
      },
    });

    await prisma.creditCard.create({
      data: {
        name: 'Inter Mastercard Black',
        brand: CardBrand.INTER,
        color: '#f97316',
        creditLimit: 1000000, // R$ 10.000,00
        closingDay: 15,
        dueDay: 22,
      },
    });

    console.log('Cartões de crédito criados com sucesso.');
  }

  console.log('--- Seed finalizado com sucesso! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
