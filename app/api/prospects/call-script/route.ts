import { NextRequest, NextResponse } from 'next/server';
import { generateColdCallScript } from '@/lib/claude';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prospectQueries } = createDb(userId);

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const prospect = await prospectQueries.get(Number(id));
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const callScript = await generateColdCallScript(prospect.business, prospect.category, prospect.notes);
  await prospectQueries.updateCallScript(callScript, id);
  return NextResponse.json({ call_script: callScript });
}
