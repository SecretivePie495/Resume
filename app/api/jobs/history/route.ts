import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { pulledJobQueries, queries } = createDb(userId);

  const [jobs, apps] = await Promise.all([pulledJobQueries.list(), queries.list()]);
  const tailoredUrls = new Set(apps.map(a => a.url).filter(Boolean));
  return NextResponse.json({
    jobs: jobs.map(j => ({ ...j, alreadyTailored: tailoredUrls.has(j.url) })),
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { pulledJobQueries } = createDb(userId);

  const { ids } = await req.json().catch(() => ({ ids: null }));

  if (Array.isArray(ids) && ids.length > 0) {
    await Promise.all(ids.map((id: number) => pulledJobQueries.delete(id)));
  } else {
    await pulledJobQueries.deleteAll();
  }

  return NextResponse.json({ ok: true });
}
