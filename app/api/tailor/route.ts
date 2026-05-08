import { NextRequest, NextResponse } from 'next/server';
import { tailorResume } from '@/lib/claude';
import { buildHTML } from '@/lib/resume';
import { queries, checkAndUse } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { company, jobTitle, jd, userResume, url } = await req.json();

    const { allowed } = await checkAndUse('resumes');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Resume limit reached. Add more resumes to continue.', limitReached: true },
        { status: 403 },
      );
    }

    const job = await tailorResume(company || undefined, jobTitle || undefined, jd || undefined, userResume || undefined);
    const html = buildHTML(job);

    const result = await queries.insert(
      company ?? null, jobTitle ?? null, jd ?? null,
      JSON.stringify(job), html, null, null, null, url ?? null,
    );

    return NextResponse.json({ id: result.id, job, html });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to tailor resume' }, { status: 500 });
  }
}
