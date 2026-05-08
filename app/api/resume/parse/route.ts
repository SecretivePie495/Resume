import { NextRequest, NextResponse } from 'next/server';

function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    import('pdf2json').then(({ default: PDFParser }) => {
      const parser = new PDFParser();
      parser.on('pdfParser_dataError', (err: any) => reject(err?.parserError ?? err));
      parser.on('pdfParser_dataReady', (data: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
        const text = data.Pages.map(page =>
          page.Texts.map(t => decodeURIComponent(t.R.map(r => r.T).join(''))).join(' ')
        ).join('\n');
        resolve(text);
      });
      (parser as any).parseBuffer(buffer);
    }).catch(reject);
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) {
    return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    let text = '';

    if (ext === 'pdf') {
      text = await extractPdfText(buffer);
    } else {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!cleaned) return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 });

    return NextResponse.json({ text: cleaned });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[parse] failed:', msg, e);
    return NextResponse.json({ error: `Failed to parse file: ${msg}` }, { status: 500 });
  }
}
