import { NextRequest, NextResponse } from 'next/server';
import { getBrowser } from '@/lib/browser';
import { queries } from '@/lib/db';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const app = queries.get.get(Number(id));
  if (!app || !app.resume_html) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(app.resume_html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true });

    const filename = `Udo_Resume_${(app.company ?? 'Job').replace(/\s+/g, '_')}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } finally {
    await page?.close();
  }
}
