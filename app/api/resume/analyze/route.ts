import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { resumeQueries } from '@/lib/db';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { resume } = await req.json();
  if (!resume?.trim()) return NextResponse.json({ error: 'Resume text required' }, { status: 400 });

  try {
    await resumeQueries.upsert(resume);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this resume and return ONLY a raw JSON object (no markdown, no explanation) with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience_level": "junior" | "mid" | "senior",
  "suggested_roles": ["Job Title 1", "Job Title 2", ...],
  "summary": "one sentence describing this candidate"
}

Rules:
- skills: 8-12 key technical/professional skills found in the resume
- suggested_roles: 6-8 specific job titles this person qualifies for, based on their actual experience
- summary: short, factual, third-person

Resume:
${resume}`,
      }],
    });

    const raw = (message.content[0] as { text: string }).text.trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Analysis failed' }, { status: 500 });
  }
}
