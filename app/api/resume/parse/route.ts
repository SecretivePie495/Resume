import { NextRequest, NextResponse } from 'next/server';

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
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
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
