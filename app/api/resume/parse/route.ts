import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
      const response = await client.beta.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        betas: ['pdfs-2024-09-25'],
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
            },
            { type: 'text', text: 'Extract all text from this resume PDF exactly as it appears. Output only the raw text, no commentary.' },
          ],
        }],
      });
      text = response.content[0].type === 'text' ? response.content[0].text : '';
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
