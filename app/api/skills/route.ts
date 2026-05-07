import { NextRequest, NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { resume } = await req.json();
    if (!resume?.trim()) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }
    const analysis = await analyzeResume(resume);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
