import Anthropic from '@anthropic-ai/sdk';
import { BASE, TailoredJob } from './resume';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TAILOR_SYSTEM = `You are a resume tailoring assistant. Given a candidate's base resume data and a job description, output a JSON object with tailored content. Return ONLY valid JSON, no markdown, no explanation.

The JSON must have exactly these fields:
- name: string (candidate's full name, exactly as it appears in the resume data provided)
- location: string (candidate's city/state as it appears in the resume data, e.g. "Denton, TX")
- phone: string (candidate's phone number exactly as it appears in the resume data)
- email: string (candidate's email address exactly as it appears in the resume data)
- linkedinUrl: string (candidate's full LinkedIn profile URL; if the resume data only has a handle, construct it as https://linkedin.com/in/&lt;handle&gt;)
- subtitle: string (one-line role headline, two role descriptors separated by " | ", e.g. "AI Solutions Engineer | Software Engineer", use &amp; for ampersand)
- summary: string (3-4 sentence professional summary tailored to the JD, use &mdash; for em-dashes, &amp; for ampersands)
- utg_title: string (a lightly reworded version of the candidate's real UTG Media title, "Founder & Lead Software Engineer", emphasizing whichever part is most relevant to the JD — do not invent a different job title, use &amp; for ampersand)
- utg_bullets: array of 5-6 bullet strings — select and lightly rephrase from the candidate's REAL UTG Media bullets (given under FIXED RESUME SECTIONS as utg bullets) to emphasize what's most relevant to the JD. Do not invent achievements not grounded in those real bullets. (use &mdash; for em-dashes, &amp; for ampersands)
- aafes_bullets: array of 4-5 bullet strings — select and lightly rephrase from the REAL AAFES bullets (given under FIXED RESUME SECTIONS as aafes bullets) to emphasize what's most relevant to the JD. Do not invent achievements not grounded in those real bullets. (use &mdash; for em-dashes, &amp; for ampersands)
- purvis_bullets: array of 4-5 bullet strings — select and lightly rephrase from the REAL Purvis Industries bullets (given under FIXED RESUME SECTIONS as purvis bullets) to emphasize what's most relevant to the JD. Do not invent achievements not grounded in those real bullets. (use &mdash; for em-dashes, &amp; for ampersands)
- skills_order: array of strings — the exact skill category names given under FIXED RESUME SECTIONS as skill categories, reordered so the categories most relevant to the JD come first. Must include every given category exactly once, using the exact strings provided (do not reword, add, or remove any).`;

const COVER_LETTER_SYSTEM = `You are a professional cover letter writer. Write a formal business-style cover letter using the exact structure below. Use plain text only — no markdown, no bullet points, no asterisks.

STRUCTURE (output each section separated by a blank line):

1. HEADER BLOCK
   Candidate's full name
   Street address (or City, State if no street found)
   Phone number
   Email address
   [Use the exact TODAY'S DATE value provided in the user message — do not calculate or guess a date]
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

const VIDEO_SCRIPT_SYSTEM = `You are writing a spoken video script for a candidate to read aloud on camera as part of a job application (like a Loom intro video). Output plain text only — no markdown, no stage directions, no bracketed notes like [pause] or [smile], no headers. Just the words the candidate will say, exactly as they'll say them.

Target length: 150-220 words (roughly 60-90 seconds spoken aloud).

Structure (do not label these sections in the output, just flow naturally between them):
1. Open with the candidate's name and the specific role/company, plus a hook — the single most relevant thing about them for this JD.
2. Cover 2-3 concrete achievements grounded in the candidate's real resume content that map directly to what the JD is asking for. Use specifics (numbers, technologies, outcomes), not generic claims.
3. Briefly say why this specific role or company is a fit, if the JD gives enough to work with — otherwise skip this rather than inventing generic enthusiasm.
4. Close with a short, natural call to action (e.g. wanting to talk more, being excited about the opportunity).

Voice: first person, conversational and natural like a real person talking, not a formal cover letter read aloud. Contractions are fine. Short sentences. No corporate jargon stacking (avoid words like "leverage," "synergy," "spearhead"). Do not invent achievements, numbers, or experience not grounded in the candidate's resume data provided.`;

const CALL_SCRIPT_SYSTEM = `You are writing a cold-call script for a job candidate to use when calling a company directly about a specific job opening — to reach a hiring manager (or whoever picks up) and introduce themselves as a candidate.

The OPENER and IF-ITS-THEM sections are fixed and provided to you separately — OPENER covers the greeting, the initial ask, the person's likely reply, and the redirect to find the right person; IF-ITS-THEM covers what to say if the person on the line turns out to be the hiring manager. Do not write either of those. Start your output directly with TRANSITION.

Output plain text only — no markdown, no asterisks, no bracketed stage directions except literal [Name] placeholders. Use the exact section headers below in this order, each in ALL CAPS on its own line, followed by a blank line, then the content. Do not output OPENER, IF-ITS-THEM, IF-NOT-RIGHT-PERSON, SITUATION QUESTIONS, PROBLEM QUESTIONS, or CONSEQUENCE QUESTION — those are not used.

TRANSITION
2-3 sentences pivoting directly from the opener into the candidate's real, relevant background — reference what the role appears to need based on the job description, and connect it to real experience/skills. This must be grounded ONLY in the actual resume content provided; do not invent achievements, technologies, or experience not present in the resume data given. If nothing in the resume clearly maps to the role, use the closest genuinely true match rather than fabricating a perfect fit.

CLOSE
1-2 sentences asking for a concrete next step: send the resume directly, or set up a short call.

OBJECTIONS
4-6 lines, each formatted exactly as "THEY SAY: ... / YOU SAY: ..." — the most likely pushback on a cold call about a job opening (e.g. using a recruiter/agency, "apply through our careers page," already in final rounds, "just email it to me," no time right now). Each YOU SAY response should redirect gracefully, never argue, and never claim anything false.

VOICEMAIL
A short fallback script (2-3 sentences) to leave if the call goes to voicemail, referencing the role.`;

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
}

function buildFixedOpener(jobTitle: string): string {
  const title = jobTitle?.trim() || 'this role';
  const roleWithArticle = jobTitle?.trim() ? `${articleFor(jobTitle)} ${jobTitle.trim()}` : 'a';
  return [
    'OPENER',
    '',
    "Hey [Name], it's Udo… uh, Udo Onyekwere.",
    '',
    `I was looking at ${roleWithArticle} role you guys are hiring for right now, and I was wondering if you could possibly.. help me out for a moment?`,
    '',
    'Them: "Sure, what\'s this about?" / "Who is this?"',
    '',
    'You: "Well, I\'m actually not sure if you\'re even the right person I should be talking to."',
    '',
    `"I was trying to figure out who's actually overseeing the ${title} opening — specifically the person who'd know what the team really needs beyond what's written in the job description."`,
    '',
    '"Who would I need to talk to about that?"',
  ].join('\n');
}

function buildFixedIfItsThem(): string {
  return [
    'IF-ITS-THEM',
    '',
    "Oh, that's actually you then — would it be alright if I carved out 10 or 15 minutes with you at some point to talk through the role?",
    '',
    'If they say yes, lock a specific window instead of leaving it open-ended: "Would tomorrow afternoon or Thursday work better?"',
  ].join('\n');
}

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

  const fixedSections = `FIXED RESUME SECTIONS (always sourced from here, regardless of the resume text above — select/reorder only, never invent):
utg bullets: ${JSON.stringify(BASE.utg.bullets)}
aafes bullets: ${JSON.stringify(BASE.aafes.bullets)}
purvis bullets: ${JSON.stringify(BASE.purvis.bullets)}
skill categories: ${JSON.stringify(BASE.skills.map(s => s.cat))}`;

  const jobContext = company || jobTitle || jd
    ? `JOB: ${jobTitle ?? 'Not specified'} at ${company ?? 'Not specified'}\n\nJOB DESCRIPTION:\n${jd ?? 'Not provided'}`
    : 'No specific job target provided. Generate a strong general-purpose resume.';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1800,
    system: [{ type: 'text', text: TAILOR_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: baseContent, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: fixedSections, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: jobContext },
      ],
    }],
  });

  const raw = (response.content[0] as { text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(raw) as TailoredJob;

  if (!userResume) {
    return {
      ...parsed,
      name: BASE.name,
      location: BASE.location,
      phone: BASE.phone,
      email: BASE.email,
      linkedinUrl: BASE.linkedinUrl,
    };
  }
  return parsed;
}

export async function answerInterviewQuestion(
  question: string,
  resumeText: string,
  jobTitle?: string,
  company?: string,
): Promise<string> {
  const jobContext = jobTitle || company
    ? `The candidate is applying for: ${jobTitle ?? ''}${company ? ` at ${company}` : ''}.`
    : '';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: [{ type: 'text', text: `You are an expert interview coach. Given a candidate's resume and an interview question, write a confident, first-person answer the candidate can say out loud. Ground every claim in their actual experience. Be specific, concise, and compelling. Use STAR format (Situation, Task, Action, Result) when appropriate. 2–4 paragraphs max. Plain text only — no bullet points, no markdown, no headers.`, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `RESUME:\n${resumeText.slice(0, 4000)}`, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `${jobContext}\n\nINTERVIEW QUESTION:\n${question}` },
      ],
    }],
  });

  return (response.content[0] as { text: string }).text.trim();
}

export async function generateCallScript(
  company: string,
  jobTitle: string,
  jd: string,
  resumeJson: string,
  rawResume?: string,
): Promise<string> {
  const candidateSection = rawResume
    ? `RAW RESUME (ground truth for real experience/skills):\n${rawResume}\n\nTAILORED RESUME HIGHLIGHTS:\n${resumeJson}`
    : `CANDIDATE RESUME:\n${resumeJson}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: [{ type: 'text', text: CALL_SCRIPT_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `CANDIDATE NAME: ${BASE.name}\n\n${candidateSection}\n\nJOB: ${jobTitle} at ${company}\n\nJOB DESCRIPTION:\n${jd}`,
    }],
  });

  const rest = (response.content[0] as { text: string }).text.trim();
  return `${buildFixedOpener(jobTitle)}\n\n${buildFixedIfItsThem()}\n\n${rest}`;
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

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: [{ type: 'text', text: COVER_LETTER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `TODAY'S DATE: ${today}\n\n${candidateSection}\n\nJOB: ${jobTitle} at ${company}\n\nJOB DESCRIPTION:\n${jd}`,
    }],
  });

  return (response.content[0] as { text: string }).text.trim();
}
