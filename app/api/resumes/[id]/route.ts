import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { savedResumeQueries } = createDb(userId);
  const { id } = await params;
  await savedResumeQueries.delete(Number(id));
  return NextResponse.json({ ok: true });
}
