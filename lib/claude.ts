import Anthropic from '@anthropic-ai/sdk';
import { BASE, TailoredJob } from './resume';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TAILOR_SYSTEM = `You are a resume tailoring assistant. Given a candidate's base resume data and a job description, output a JSON object with tailored content. Return ONLY valid JSON, no markdown, no explanation.

The JSON must have exactly these fields:
- subtitle: string (one-line role summary with key tools, use · as separator for tools)
- summary: string (2-3 sentence professional summary tailored to the JD, use &mdash; for em-dashes, &amp; for ampersands)
- skills: array of 5 objects with "cat" and "items" fields
- utg_title: string (Founder & [tailored title], use &amp; for ampersand)
- utg_bullets: array of 6-7 bullet strings tailored to the JD (use &mdash; for em-dashes, &amp; for ampersands)
- lead_revival_bullet: string (1-2 sentence project description angled toward the JD)`;

const COVER_LETTER_SYSTEM = `You are a professional cover letter writer. Write a formal business-style cover letter using the exact structure below. Use plain text only — no markdown, no bullet points, no asterisks.

STRUCTURE (output each section separated by a blank line):

1. HEADER BLOCK
   Candidate's full name
   Street address (or City, State if no street found)
   Phone number
   Email address
   [Today's date in "Month D, YYYY" format]
   [blank line]
   Hiring Manager's Name and Title (use "Hiring Manager" if unknown)
   [Company Name]
   [Company address if known, otherwise omit]

2. SALUTATION
   "Dear [Hiring Manager's Name]," — use specific name if provided, otherwise "Dear Hiring Manager,"

3. OPENING PARAGRAPH
   State the exact position being applied for, where it was found, and a compelling hook — one strong achievement or a specific reason this role is the right fit.

4. BODY (1–2 paragraphs)
   Connect the candidate's experience and specific achievements to the job requirements. Use concrete examples. Show awareness of the company or role. Do not restate the resume line-by-line.

5. CLOSING PARAGRAPH
   Express genuine enthusiasm, request an interview, note that the resume is attached, and thank the reader for their time.

6. SIGN-OFF
   "Sincerely,"
   [blank line]
   Candidate's full name

Extract the candidate's name, address, phone, and email from the raw resume text provided. If any field is missing from the resume, omit that line rather than inserting a placeholder.`;

export interface ResumeAnalysis {
  skills: string[];
  country: string;
  roleTypes: string[];
  salaryMin: number;
  salaryMax: number;
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Analyze this resume and return ONLY a JSON object with no explanation.

Fields required:
- skills: array of up to 25 key technical/professional skills
- country: the candidate's country (infer from address, phone format, or context; default "United States" if unclear)
- roleTypes: array of 3-5 specific job titles this person should target based on their experience
- salaryMin: realistic minimum annual salary in USD for this experience level (integer, no commas)
- salaryMax: realistic maximum annual salary in USD for this experience level (integer, no commas)

RESUME:
${resumeText.slice(0, 4000)}`,
    }],
  });

  const raw = (response.content[0] as { text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(raw) as ResumeAnalysis;
}

export async function tailorResume(company?: string, jobTitle?: string, jd?: string, userResume?: string): Promise<TailoredJob> {
  const baseContent = userResume
    ? `CANDIDATE'S RESUME (plain text):\n${userResume}`
    : `BASE RESUME DATA:\n${JSON.stringify(BASE, null, 2)}`;

  const jobContext = company || jobTitle || jd
    ? `JOB: ${jobTitle ?? 'Not specified'} at ${company ?? 'Not specified'}\n\nJOB DESCRIPTION:\n${jd ?? 'Not provided'}`
    : 'No specific job target provided. Generate a strong general-purpose resume.';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: [{ type: 'text', text: TAILOR_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: baseContent, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: jobContext },
      ],
    }],
  });

  const raw = (response.content[0] as { text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(raw) as TailoredJob;
}

export async function generateCoverLetter(
  company: string,
  jobTitle: string,
  jd: string,
  resumeJson: string,
  rawResume?: string,
): Promise<string> {
  const candidateSection = rawResume
    ? `RAW RESUME (use this to extract name, address, phone, email):\n${rawResume}\n\nTAILORED RESUME HIGHLIGHTS:\n${resumeJson}`
    : `CANDIDATE RESUME:\n${resumeJson}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: [{ type: 'text', text: COVER_LETTER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `${candidateSection}\n\nJOB: ${jobTitle} at ${company}\n\nJOB DESCRIPTION:\n${jd}`,
    }],
  });

  return (response.content[0] as { text: string }).text.trim();
}
