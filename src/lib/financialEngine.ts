/**
 * MOTOR FINANCEIRO CENTRAL — FINANCEIRO MASTER
 * 
 * Regras cruciais:
 * 1. Todos os valores são calculados em CENTAVOS (inteiros) para evitar erros de ponto flutuante.
 * 2. Compra no cartão de crédito:
 *    - É uma DESPESA DE CONSUMO na data da compra.
 *    - NÃO debita saldo bancário imediatamente.
 * 3. Pagamento de fatura:
 *    - É uma SAÍDA DE CAIXA (liquidação de passivo).
 *    - NÃO é uma segunda despesa de consumo nos relatórios de categorias/competência.
 * 4. Transferência entre contas próprias:
 *    - NÃO é receita e NÃO é despesa.
 * 5. Empréstimos:
 *    - Empréstimo concedido = Saída de caixa -> vira ativo a receber.
 *    - Empréstimo recebido = Entrada de caixa -> vira passivo a pagar.
 */

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
}

/**
 * Formata centavos para a moeda brasileira (ex: 125050 -> "R$ 1.250,50")
 */
export function formatCentsToBRL(cents: number, options: CurrencyFormatOptions = { showSymbol: true }): string {
  const isNegative = cents < 0;
  const absoluteCents = Math.abs(cents);
  const reais = Math.floor(absoluteCents / 100);
  const centavos = absoluteCents % 100;

  const formattedReais = reais.toLocaleString('pt-BR');
  const formattedCentavos = centavos.toString().padStart(2, '0');
  const formattedValue = `${formattedReais},${formattedCentavos}`;

  const prefix = isNegative ? '-' : '';
  if (options.showSymbol) {
    return `${prefix}R$ ${formattedValue}`;
  }
  return `${prefix}${formattedValue}`;
}

/**
 * Converte string ou float em centavos inteiros (ex: "150,50" ou "150.50" -> 15050)
 */
export function parseBRLToCents(val: string | number): number {
  if (typeof val === 'number') {
    return Math.round(val * 100);
  }
  if (!val) return 0;
  
  // Limpar símbolos
  let clean = val.replace(/R\$\s?/, '').trim();
  clean = clean.replace(/\./g, ''); // remove separadores de milhar
  clean = clean.replace(',', '.'); // substitui vírgula por ponto
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export interface BalanceBreakdown {
  totalInAccounts: number;       // Saldo total nas contas bancárias e carteiras
  cashBalance: number;           // Dinheiro em espécie
  availableBalance: number;      // Saldo que realmente pode ser gasto (saldo contas - compromissos imediatos)
  committedBalance: number;      // Compromissos a vencer até o fim do ciclo (contas a pagar + faturas abertas)
  monthlyIncome: number;         // Receitas no período
  monthlyExpense: number;        // Despesas reconhecidas de consumo no período
  monthlyNet: number;            // Receitas - Despesas de consumo
  openInvoicesTotal: number;     // Faturas de cartão em aberto
  futureInstallmentsTotal: number;// Parcelas futuras a vencer
  pendingDebtsToPay: number;     // Dívidas pendentes a pagar
  pendingToReceive: number;      // Valores a receber (empréstimos concedidos + contas a receber)
  netWorth: number;              // Patrimônio líquido = (Contas + A Receber) - (Faturas + Dívidas + Contas a Pagar)
}

/**
 * Calcula os indicadores essenciais do painel
 */
export function calculateFinancialMetrics(data: {
  accounts: Array<{ type: string; currentBalance: number }>;
  transactions: Array<{
    type: string;
    amount: number;
    date: Date | string;
    status: string;
  }>;
  openInvoices: Array<{ totalAmount: number; paidAmount: number }>;
  pendingPayables: Array<{ amount: number }>;
  pendingReceivables: Array<{ amount: number }>;
  debtsToPay: Array<{ remainingAmount: number }>;
  debtsToReceive: Array<{ remainingAmount: number }>;
  futureInstallments: Array<{ amountPerInstallment: number; remainingCount: number }>;
}): BalanceBreakdown {
  // 1. Saldos de contas
  let totalInAccounts = 0;
  let cashBalance = 0;

  for (const acc of data.accounts) {
    totalInAccounts += acc.currentBalance;
    if (acc.type === 'CASH') {
      cashBalance += acc.currentBalance;
    }
  }

  // 2. Faturas em aberto (saldo devedor nos cartões)
  let openInvoicesTotal = 0;
  for (const inv of data.openInvoices) {
    openInvoicesTotal += Math.max(0, inv.totalAmount - inv.paidAmount);
  }

  // 3. Contas a pagar e receber
  let pendingBillsPayable = 0;
  for (const bill of data.pendingPayables) {
    pendingBillsPayable += bill.amount;
  }

  let pendingBillsReceivable = 0;
  for (const bill of data.pendingReceivables) {
    pendingBillsReceivable += bill.amount;
  }

  // 4. Dívidas e Empréstimos
  let pendingDebtsToPay = 0;
  for (const d of data.debtsToPay) {
    pendingDebtsToPay += d.remainingAmount;
  }

  let pendingDebtsToReceive = 0;
  for (const d of data.debtsToReceive) {
    pendingDebtsToReceive += d.remainingAmount;
  }

  // 5. Parcelas futuras
  let futureInstallmentsTotal = 0;
  for (const inst of data.futureInstallments) {
    futureInstallmentsTotal += inst.amountPerInstallment * inst.remainingCount;
  }

  // 6. Entradas e despesas do período selecionado
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  for (const tx of data.transactions) {
    if (tx.status === 'CANCELLED') continue;

    if (tx.type === 'INCOME') {
      monthlyIncome += tx.amount;
    } else if (tx.type === 'EXPENSE' || tx.type === 'CREDIT_CARD_EXPENSE') {
      // Regra: compra no cartão É despesa de consumo imediata.
      monthlyExpense += tx.amount;
    }
    // NOTA: TRANSFER e INVOICE_PAYMENT não entram em despesas de consumo!
  }

  const monthlyNet = monthlyIncome - monthlyExpense;

  // Compromissos imediatos = contas a pagar imediatas + faturas abertas do ciclo
  const committedBalance = pendingBillsPayable + openInvoicesTotal;
  const availableBalance = totalInAccounts - committedBalance;

  // Valores a receber totais
  const pendingToReceive = pendingBillsReceivable + pendingDebtsToReceive;

  // Patrimônio Líquido = Ativos (Contas + A Receber) - Passivos (Faturas abertas + Contas a Pagar + Dívidas)
  const totalAssets = totalInAccounts + pendingToReceive;
  const totalLiabilities = openInvoicesTotal + pendingBillsPayable + pendingDebtsToPay;
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalInAccounts,
    cashBalance,
    availableBalance,
    committedBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
    openInvoicesTotal,
    futureInstallmentsTotal,
    pendingDebtsToPay,
    pendingToReceive,
    netWorth,
  };
}
