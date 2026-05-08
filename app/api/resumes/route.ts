import { NextRequest, NextResponse } from 'next/server';
import { savedResumeQueries } from '@/lib/db';

export async function GET() {
  const resumes = await savedResumeQueries.list();
  return NextResponse.json({ resumes });
}

export async function POST(req: NextRequest) {
  const { name, content } = await req.json();
  if (!name?.trim())    return NextResponse.json({ error: 'Name is required' },    { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  const result = await savedResumeQueries.insert(name.trim(), content.trim());
  const saved  = await savedResumeQueries.get(result.id);
  return NextResponse.json({ resume: saved });
}
