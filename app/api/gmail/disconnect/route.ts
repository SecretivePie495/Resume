import { NextResponse } from 'next/server';
import { gmailTokenQueries } from '@/lib/db';

export async function POST() {
  await gmailTokenQueries.delete();
  return NextResponse.json({ ok: true });
}
