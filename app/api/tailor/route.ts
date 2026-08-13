import { NextRequest, NextResponse } from 'next/server';
import { tailorResume } from '@/lib/claude';
import { buildHTML, DEFAULT_STYLE, ResumeStyle } from '@/lib/resume';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { company, jobTitle, jd, userResume, url } = await req.json();

    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { queries, styleQueries, checkAndUse } = createDb(userId);

    const { allowed } = await checkAndUse('resumes');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Resume limit reached. Add more resumes to continue.', limitReached: true },
        { status: 403 },
      );
    }

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

    const job  = await tailorResume(company || undefined, jobTitle || undefined, jd || undefined, userResume || undefined);
    const html = buildHTML(job, style);
    const result = await queries.insert(company ?? null, jobTitle ?? null, jd ?? null, JSON.stringify(job), html, null, null, null, url ?? null);

    return NextResponse.json({ id: result.id, job, html });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to tailor resume' }, { status: 500 });
  }
}
