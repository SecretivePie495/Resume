import { NextRequest, NextResponse } from 'next/server';
import { getUsage, addExtraResumes } from '@/lib/db';

export async function GET() {
  const usage = getUsage();
  return NextResponse.json(usage);
}

export async function POST(req: NextRequest) {
  const { resumes } = await req.json();
  if (!resumes || typeof resumes !== 'number' || resumes <= 0) {
    return NextResponse.json({ error: 'Invalid resumes count' }, { status: 400 });
  }
  // TODO: verify Stripe payment here before adding credits
  addExtraResumes(resumes);
  return NextResponse.json({ ok: true, added: resumes });
}
