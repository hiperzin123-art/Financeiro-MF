/**
 * PARSER UNIVERSAL DE FATURAS DE CARTÃO DE CRÉDITO
 * Suporta Digio, Mercado Pago, Nubank, Inter, Itaú, Bradesco, Santander e outros bancos brasileiros.
 */

import { parseBRLToCents } from './financialEngine';

export interface ExtractedInvoiceTransaction {
  date: string;       // YYYY-MM-DD
  description: string;
  amount: number;     // Em centavos
  installmentCurrent?: number;
  installmentTotal?: number;
  categoryGuess?: string;
  tag?: string;
}

export interface ExtractedInvoiceData {
  bankOrIssuer: string;
  dueDate?: string;
  totalAmount: number; // Em centavos
  transactions: ExtractedInvoiceTransaction[];
}

export function parseInvoiceText(rawText: string): ExtractedInvoiceData {
  // Dividir por quebras de linha e decodificar caracteres URL que possam vir do pdf2json
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => {
      try {
        return decodeURIComponent(l).trim();
      } catch {
        return l.trim();
      }
    })
    .filter((l) => l.length > 0);

  let bankOrIssuer = 'Fatura de Cartão';
  const lowerText = rawText.toLowerCase();

  if (lowerText.includes('digio')) bankOrIssuer = 'Digio';
  else if (lowerText.includes('mercado pago')) bankOrIssuer = 'Mercado Pago';
  else if (lowerText.includes('nubank')) bankOrIssuer = 'Nubank';
  else if (lowerText.includes('inter')) bankOrIssuer = 'Banco Inter';
  else if (lowerText.includes('itau') || lowerText.includes('itaú')) bankOrIssuer = 'Itaú';
  else if (lowerText.includes('bradesco')) bankOrIssuer = 'Bradesco';
  else if (lowerText.includes('santander')) bankOrIssuer = 'Santander';

  const transactions: ExtractedInvoiceTransaction[] = [];
  let calculatedTotal = 0;

  // Regex para data no início da linha (DD/MM ou DD/MM/AAAA)
  const lineDateRegex = /^(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.*)/;
  // Regex para valor em dinheiro no final da linha (ex: R$ 9,94 ou R$ 1.234,56 ou apenas 19,50 ou -174,87)
  const lineMoneyRegex = /(?:r\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})\s*$/i;
  // Regex para capturar parcelas (ex: "Parcela 9 de 10" ou "3/4")
  const installmentRegex = /(?:parcela\s+)?(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/i;

  const currentYear = new Date().getFullYear();

  // Cabeçalhos e linhas que não devem ser somadas como despesas
  const ignoreKeywords = [
    'pagamento da fatura',
    'inclusao pgto online fatura',
    'pagamentos e créditos',
    'total da fatura',
    'total r$',
    'resumo da fatura',
    'limite total',
    'saque total',
    'total a pagar',
    'vence em',
    'data movimentações',
    'data descrição parcela valor',
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Se a linha começar com alguma palavra de cabeçalho, pula
    if (ignoreKeywords.some((kw) => lowerLine.startsWith(kw) || lowerLine === kw)) {
      continue;
    }

    // A linha precisa começar com data: DD/MM ou DD/MM/AAAA
    const dateMatch = line.match(lineDateRegex);
    if (!dateMatch) continue;

    const rawDate = dateMatch[1];
    const restOfLine = dateMatch[2];

    // O final da linha precisa conter o valor em R$
    const moneyMatch = restOfLine.match(lineMoneyRegex);
    if (!moneyMatch) continue;

    const amountStr = moneyMatch[1];
    // Se for pagamento/estorno negativo, ignora
    if (amountStr.startsWith('-')) continue;

    const amountCents = parseBRLToCents(amountStr);
    if (amountCents <= 0) continue;

    // Normalizar a data para YYYY-MM-DD
    const dateParts = rawDate.split('/');
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2] || currentYear.toString();
    const formattedDate = `${year}-${month}-${day}`;

    // Extrair descrição removendo o valor monetário do final
    let description = restOfLine.replace(lineMoneyRegex, '').trim();

    // Se for linha de pagamento, ignora
    if (
      description.toLowerCase().includes('pgto online fatura') ||
      description.toLowerCase().includes('pagamento da fatura')
    ) {
      continue;
    }

    // Extrair parcelamento (ex: "SHOPEE *STESSYSHOES 3/4" ou "Parcela 9 de 10")
    let installmentCurrent: number | undefined;
    let installmentTotal: number | undefined;

    const instMatch = description.match(installmentRegex);
    if (instMatch) {
      installmentCurrent = parseInt(instMatch[1]);
      installmentTotal = parseInt(instMatch[2]);
    }

    // Estimativa de categoria
    let categoryGuess = 'Outros Gastos';
    const descLower = description.toLowerCase();

    if (
      descLower.includes('ifd') ||
      descLower.includes('frutas') ||
      descLower.includes('churrascaria') ||
      descLower.includes('mercado') ||
      descLower.includes('alimento') ||
      descLower.includes('padaria') ||
      descLower.includes('lanche')
    ) {
      categoryGuess = 'Alimentação';
    } else if (
      descLower.includes('shopee') ||
      descLower.includes('shein') ||
      descLower.includes('mercadolivre') ||
      descLower.includes('aliexpress') ||
      descLower.includes('somadeiras') ||
      descLower.includes('calcados') ||
      descLower.includes('moda')
    ) {
      categoryGuess = 'Outros Gastos';
    } else if (
      descLower.includes('tiktok') ||
      descLower.includes('adobe') ||
      descLower.includes('netflix') ||
      descLower.includes('spotify')
    ) {
      categoryGuess = 'Assinaturas & Serviços';
    } else if (
      descLower.includes('uber') ||
      descLower.includes('combustivel') ||
      descLower.includes('posto')
    ) {
      categoryGuess = 'Transporte';
    }

    transactions.push({
      date: formattedDate,
      description,
      amount: amountCents,
      installmentCurrent,
      installmentTotal,
      categoryGuess,
    });

    calculatedTotal += amountCents;
  }

  return {
    bankOrIssuer,
    totalAmount: calculatedTotal,
    transactions,
  };
}
