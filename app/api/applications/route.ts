import { NextRequest, NextResponse } from 'next/server';
import { queries } from '@/lib/db';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const app = await queries.get(Number(id));
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(app);
  }
  const apps = await queries.list();
  return NextResponse.json(apps);
}

export async function PATCH(req: NextRequest) {
  const { id, status, notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  await queries.updateStatus(status, notes ?? null, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await queries.delete(Number(id));
  return NextResponse.json({ ok: true });
}
