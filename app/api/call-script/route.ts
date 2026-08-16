import { NextRequest, NextResponse } from 'next/server';
import { generateCallScript } from '@/lib/claude';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { BASE, TailoredJob } from '@/lib/resume';

function resumeToText(json: string): string {
  const fallbackContact = [
    `Name: ${BASE.name}`,
    `Location: ${BASE.location}`,
    `Phone: ${BASE.phone}`,
    `Email: ${BASE.email}`,
  ];
  try {
    const r = JSON.parse(json) as TailoredJob;
    const contact = [
      `Name: ${r.name ?? BASE.name}`,
      `Location: ${r.location ?? BASE.location}`,
      `Phone: ${r.phone ?? BASE.phone}`,
      `Email: ${r.email ?? BASE.email}`,
    ];
    return [
      ...contact,
      r.subtitle,
      r.summary,
      'Skills: ' + BASE.skills.map(s => `${s.cat}: ${s.items}`).join(' | '),
      ...r.utg_bullets,
    ].join('\n');
  } catch {
    return [...fallbackContact, json].join('\n');
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
      { error: 'Generation limit reached for this month.', limitReached: true },
      { status: 403 },
    );
  }

  const baseResume = await resumeQueries.get();
  const callScript = await generateCallScript(
    app.company ?? '',
    app.job_title ?? '',
    app.job_description ?? '',
    resumeToText(app.resume_json ?? ''),
    baseResume?.content,
  );

  await queries.updateCallScript(callScript, id);
  return NextResponse.json({ call_script: callScript });
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries } = createDb(userId);

  const { id, call_script } = await req.json();
  if (!id || typeof call_script !== 'string') {
    return NextResponse.json({ error: 'id and call_script required' }, { status: 400 });
  }

  const app = await queries.get(Number(id));
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await queries.updateCallScript(call_script, id);
  return NextResponse.json({ ok: true });
}
