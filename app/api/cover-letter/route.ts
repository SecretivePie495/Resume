import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/claude';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { TailoredJob } from '@/lib/resume';

function resumeToText(json: string): string {
  try {
    const r = JSON.parse(json) as TailoredJob;
    return [
      r.subtitle,
      r.summary,
      'Skills: ' + r.skills.map(s => `${s.cat}: ${s.items}`).join(' | '),
      ...r.utg_bullets,
      r.lead_revival_bullet,
    ].join('\n');
  } catch {
    return json;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries, resumeQueries, checkAndUse } = createDb(userId);

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const app = await queries.get(Number(id));
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { allowed } = await checkAndUse('covers');
  if (!allowed) {
    return NextResponse.json(
      { error: 'Cover letter limit reached for this month.', limitReached: true },
      { status: 403 },
    );
  }

  const baseResume = await resumeQueries.get();
  const coverLetter = await generateCoverLetter(
    app.company ?? '',
    app.job_title ?? '',
    app.job_description ?? '',
    resumeToText(app.resume_json ?? ''),
    baseResume?.content,
  );

  await queries.updateCoverLetter(coverLetter, id);
  return NextResponse.json({ cover_letter: coverLetter });
}
