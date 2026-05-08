import { NextRequest, NextResponse } from 'next/server';
import { answerInterviewQuestion } from '@/lib/claude';
import { queries } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { question, appId } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    if (!appId)            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });

    const app = await queries.get(appId);
    if (!app)             return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    if (!app.resume_json) return NextResponse.json({ error: 'No resume found for this application' }, { status: 400 });

    const answer = await answerInterviewQuestion(
      question,
      app.resume_json,
      app.job_title ?? undefined,
      app.company ?? undefined,
    );
    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
