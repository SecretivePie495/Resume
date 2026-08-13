import { NextRequest, NextResponse } from 'next/server';
import { getBrowser } from '@/lib/browser';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { buildCoverLetterHTML, DEFAULT_STYLE, ResumeStyle } from '@/lib/resume';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries, styleQueries } = createDb(userId);

  const app = await queries.get(Number(id));
  if (!app || !app.cover_letter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const styleRow = await styleQueries.get();
  const style: ResumeStyle = styleRow ? {
    fontFamily: styleRow.font_family,
    nameSize: styleRow.name_size,
    subtitleSize: styleRow.subtitle_size,
    sectionSize: styleRow.section_size,
    bodySize: styleRow.body_size,
    accentColor: styleRow.accent_color,
    secondaryColor: styleRow.secondary_color,
  } : DEFAULT_STYLE;

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(buildCoverLetterHTML(app.cover_letter, style), { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true });
    const company = (app.company ?? 'Job').replace(/[\\/:*?"<>|]/g, '').trim();
    const filename = `Udo Onyekwere Cover Letter ${company}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } finally {
    await page?.close();
  }
}
