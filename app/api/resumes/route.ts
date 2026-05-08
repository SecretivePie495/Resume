import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { savedResumeQueries } = createDb(userId);
  return NextResponse.json({ resumes: await savedResumeQueries.list() });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { savedResumeQueries } = createDb(userId);

  const { name, content } = await req.json();
  if (!name?.trim())    return NextResponse.json({ error: 'Name is required' },    { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

  const result = await savedResumeQueries.insert(name.trim(), content.trim());
  const saved  = await savedResumeQueries.get(result.id);
  return NextResponse.json({ resume: saved });
}
