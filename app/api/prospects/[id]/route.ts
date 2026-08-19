import { NextRequest, NextResponse } from 'next/server';
import { createDb, ProspectStatus } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

const VALID_STATUSES: ProspectStatus[] = ['not_called', 'called', 'interested', 'not_interested'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { status, notes } = await req.json();

  const { prospectQueries } = createDb(userId);
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    await prospectQueries.updateStatus(status, Number(id));
  }
  if (typeof notes === 'string') {
    await prospectQueries.updateNotes(notes, Number(id));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { prospectQueries } = createDb(userId);
  await prospectQueries.delete(Number(id));
  return NextResponse.json({ ok: true });
}
