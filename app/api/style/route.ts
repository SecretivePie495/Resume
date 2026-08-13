import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { DEFAULT_STYLE, FONT_OPTIONS, ResumeStyle } from '@/lib/resume';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { styleQueries } = createDb(userId);

  const row = await styleQueries.get();
  if (!row) return NextResponse.json({ style: DEFAULT_STYLE });

  const style: ResumeStyle = {
    fontFamily: row.font_family,
    nameSize: row.name_size,
    subtitleSize: row.subtitle_size,
    sectionSize: row.section_size,
    bodySize: row.body_size,
    accentColor: row.accent_color,
    secondaryColor: row.secondary_color,
  };
  return NextResponse.json({ style });
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { styleQueries } = createDb(userId);

  const body = await req.json() as Partial<ResumeStyle>;

  if (body.fontFamily && !(body.fontFamily in FONT_OPTIONS)) {
    return NextResponse.json({ error: 'Invalid fontFamily' }, { status: 400 });
  }
  const hexColor = /^#[0-9a-fA-F]{6}$/;
  if (body.accentColor && !hexColor.test(body.accentColor)) {
    return NextResponse.json({ error: 'Invalid accentColor' }, { status: 400 });
  }
  if (body.secondaryColor && !hexColor.test(body.secondaryColor)) {
    return NextResponse.json({ error: 'Invalid secondaryColor' }, { status: 400 });
  }
  const sizeFields: (keyof ResumeStyle)[] = ['nameSize', 'subtitleSize', 'sectionSize', 'bodySize'];
  for (const field of sizeFields) {
    const v = body[field];
    if (v !== undefined && (typeof v !== 'number' || v < 6 || v > 40)) {
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    }
  }

  const merged: ResumeStyle = { ...DEFAULT_STYLE, ...(await styleQueries.get().then(row => row ? {
    fontFamily: row.font_family,
    nameSize: row.name_size,
    subtitleSize: row.subtitle_size,
    sectionSize: row.section_size,
    bodySize: row.body_size,
    accentColor: row.accent_color,
    secondaryColor: row.secondary_color,
  } : {})), ...body };

  await styleQueries.upsert({
    font_family: merged.fontFamily,
    name_size: merged.nameSize,
    subtitle_size: merged.subtitleSize,
    section_size: merged.sectionSize,
    body_size: merged.bodySize,
    accent_color: merged.accentColor,
    secondary_color: merged.secondaryColor,
  });

  return NextResponse.json({ style: merged });
}
