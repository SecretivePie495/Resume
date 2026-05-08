import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries } = createDb(userId);

  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const app = await queries.get(Number(id));
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(app);
  }
  return NextResponse.json(await queries.list());
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries } = createDb(userId);

  const { id, status, notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  await queries.updateStatus(status, notes ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { queries } = createDb(userId);

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await queries.delete(Number(id));
  return NextResponse.json({ ok: true });
}
