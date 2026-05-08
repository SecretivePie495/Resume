import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { gmailTokenQueries } = createDb(userId);
  await gmailTokenQueries.delete();
  return NextResponse.json({ ok: true });
}
