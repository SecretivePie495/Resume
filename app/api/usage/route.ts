import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { getUsage, hasInboxAccess } = createDb(userId);
  const [usage, inboxAccess] = await Promise.all([getUsage(), hasInboxAccess()]);
  return NextResponse.json({ ...usage, inboxAccess });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { addExtraResumes } = createDb(userId);

  const { resumes } = await req.json();
  if (!resumes || typeof resumes !== 'number' || resumes <= 0) {
    return NextResponse.json({ error: 'Invalid resumes count' }, { status: 400 });
  }
  await addExtraResumes(resumes);
  return NextResponse.json({ ok: true, added: resumes });
}
