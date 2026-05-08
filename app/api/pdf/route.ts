import { NextRequest, NextResponse } from 'next/server';
import { getBrowser } from '@/lib/browser';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries } = createDb(userId);

  const app = await queries.get(Number(id));
  if (!app || !app.resume_html) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(app.resume_html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true });
    const filename = `Resume_${(app.company ?? 'Job').replace(/\s+/g, '_')}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } finally {
    await page?.close();
  }
}
