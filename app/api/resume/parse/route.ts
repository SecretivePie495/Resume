import { NextRequest, NextResponse } from 'next/server';

// Polyfill browser globals pdfjs needs in Node.js serverless
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0;
    m11=1; m12=0; m13=0; m14=0; m21=0; m22=1; m23=0; m24=0;
    m31=0; m32=0; m33=1; m34=0; m41=0; m42=0; m43=0; m44=1;
    is2D=true; isIdentity=true;
    translate() { return this; } scale() { return this; }
    rotate() { return this; }  multiply() { return this; }
    inverse() { return this; } transformPoint(p: any) { return p; }
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false, useSystemFonts: true }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((item: any) => ('str' in item ? item.str : '')).join(' '));
  }

  return parts.join('\n');
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
