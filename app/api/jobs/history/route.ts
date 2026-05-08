import { NextResponse } from 'next/server';
import { pulledJobQueries, queries as appQueries } from '@/lib/db';

export async function GET() {
  const [jobs, apps] = await Promise.all([pulledJobQueries.list(), appQueries.list()]);
  const tailoredUrls = new Set(apps.map(a => a.url).filter(Boolean));
  return NextResponse.json({
    jobs: jobs.map(j => ({ ...j, alreadyTailored: tailoredUrls.has(j.url) })),
  });
}
