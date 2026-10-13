import { NextResponse } from 'next/server';
import { parseInvoiceText } from '@/lib/invoiceParser';
const PDFParser = require('pdf2json');

function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
    pdfParser.on('pdfParser_dataReady', () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('text') as string | null;

    let textContent = '';

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      try {
        textContent = await extractTextFromBuffer(buffer);
      } catch (pdfErr) {
        console.error('Erro na extração com pdf2json:', pdfErr);
        textContent = buffer.toString('utf-8');
      }
    } else if (rawText) {
      textContent = rawText;
    } else {
      return NextResponse.json({ error: 'Nenhum arquivo ou texto enviado.' }, { status: 400 });
    }

    const parsedData = parseInvoiceText(textContent);

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawLength: textContent.length,
    });
  } catch (error: any) {
    console.error('Erro na rota de importação de fatura:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar fatura' }, { status: 500 });
  }
}
