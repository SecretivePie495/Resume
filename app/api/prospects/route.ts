import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { parseProspectList } from '@/lib/claude';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prospectQueries } = createDb(userId);
  const prospects = await prospectQueries.list();
  return NextResponse.json({ prospects });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  const parsed = await parseProspectList(text);
  const { prospectQueries } = createDb(userId);
  const count = await prospectQueries.insertMany(parsed);
  const prospects = await prospectQueries.list();
  return NextResponse.json({ imported: count, prospects });
}
