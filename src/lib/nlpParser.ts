/**
 * PARSER NATURAL DE LINGUAGEM EM PORTUGUÊS (PT-BR)
 * Interpreta frases sem necessidade de IA paga ou externa:
 * - "Gastei 35 reais no almoço em dinheiro"
 * - "Paguei 120 reais de combustível no Pix"
 * - "Recebi 500 reais de comissão"
 * - "Anota 89,90 de mercado no cartão Nubank"
 * - "Emprestei 200 reais para João"
 * - "Paguei 150 reais da minha dívida"
 */

import { parseBRLToCents } from './financialEngine';

export interface ParsedCommand {
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_EXPENSE' | 'DEBT_PAYMENT' | 'LOAN_GIVEN' | 'LOAN_RECEIVED';
  amount: number; // em centavos
  description: string;
  categoryGuess?: string;
  paymentMethod?: string;
  cardGuess?: string;
  relatedPerson?: string;
  rawText: string;
}

export function parseNaturalCommand(text: string): ParsedCommand | null {
  if (!text || text.trim().length === 0) return null;

  const normalized = text.toLowerCase().trim();

  // 1. Extração do Valor
  // Padrões como: 35 reais, 35,50, R$ 120, 89.90
  const valueRegex = /(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i;
  const valMatch = normalized.match(valueRegex);

  let amountInCents = 0;
  if (valMatch && valMatch[1]) {
    amountInCents = parseBRLToCents(valMatch[1]);
  }

  // 2. Extração do Tipo
  let type: ParsedCommand['type'] = 'EXPENSE';
  if (normalized.includes('recebi') || normalized.includes('ganhei') || normalized.includes('salário') || normalized.includes('comissão')) {
    type = 'INCOME';
  } else if (normalized.includes('emprestei')) {
    type = 'LOAN_GIVEN';
  } else if (normalized.includes('peguei emprestado') || normalized.includes('tomei emprestado')) {
    type = 'LOAN_RECEIVED';
  } else if (normalized.includes('minha dívida') || normalized.includes(' Quitei dívida') || normalized.includes('quitei')) {
    type = 'DEBT_PAYMENT';
  } else if (normalized.includes('cartão') || normalized.includes('nubank') || normalized.includes('crédito')) {
    type = 'CREDIT_CARD_EXPENSE';
  } else if (normalized.includes('transferi') || normalized.includes('transferência')) {
    type = 'TRANSFER';
  }

  // 3. Extração do Método de Pagamento
  let paymentMethod = 'Outro';
  if (normalized.includes('pix')) paymentMethod = 'Pix';
  else if (normalized.includes('dinheiro')) paymentMethod = 'Dinheiro';
  else if (normalized.includes('débito')) paymentMethod = 'Débito';
  else if (normalized.includes('crédito') || normalized.includes('cartão')) paymentMethod = 'Crédito';
  else if (normalized.includes('boleto')) paymentMethod = 'Boleto';

  // 4. Extração de Pessoa Relacionada
  let relatedPerson: string | undefined;
  const personMatch = normalized.match(/(?:para|com|de)\s+([a-zà-ú]+)(?:\s|$)/i);
  if (personMatch && !['mercado', 'almoço', 'combustível', 'energia', 'mim'].includes(personMatch[1])) {
    relatedPerson = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1);
  }

  // 5. Categoria e Descrição
  let categoryGuess = 'Outros Gastos';
  let description = 'Lançamento Rápido';

  if (normalized.includes('almoço') || normalized.includes('restaurante') || normalized.includes('mercado') || normalized.includes('comida') || normalized.includes('lanche')) {
    categoryGuess = 'Alimentação';
    description = normalized.includes('mercado') ? 'Supermercado' : 'Almoço / Refeição';
  } else if (normalized.includes('combustível') || normalized.includes('gasolina') || normalized.includes('uber') || normalized.includes('ônibus')) {
    categoryGuess = 'Transporte';
    description = 'Combustível / Transporte';
  } else if (normalized.includes('comissão') || normalized.includes('salário')) {
    categoryGuess = 'Salário & Remuneração';
    description = normalized.includes('comissão') ? 'Comissão' : 'Salário';
  } else if (normalized.includes('energia') || normalized.includes('luz') || normalized.includes('água') || normalized.includes('aluguel')) {
    categoryGuess = 'Moradia';
    description = 'Conta de Moradia / Utilidades';
  } else if (normalized.includes('remédio') || normalized.includes('farmácia') || normalized.includes('médico')) {
    categoryGuess = 'Saúde';
    description = 'Farmácia / Saúde';
  } else {
    // Tenta usar o texto limpo como descrição
    description = text.replace(/(?:gastei|paguei|recebi|anota|reais|no pix|no cartão|em dinheiro)/gi, '').trim();
    if (description.length < 3) description = 'Movimentação sem descrição';
  }

  // 6. Cartão
  let cardGuess: string | undefined;
  if (normalized.includes('nubank')) cardGuess = 'Nubank Roxinho';
  else if (normalized.includes('inter')) cardGuess = 'Inter Mastercard Black';

  return {
    type,
    amount: amountInCents,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    categoryGuess,
    paymentMethod,
    cardGuess,
    relatedPerson,
    rawText: text,
  };
}
