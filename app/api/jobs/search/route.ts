import { NextRequest, NextResponse } from 'next/server';
import { checkAndUse, queries as appQueries, pulledJobQueries } from '@/lib/db';

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary?: string;
  postedAt?: string;
  locationMatch: boolean;
  skillScore: number;
  alreadyTailored: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesCountry(jobLocation: string, userCountry: string): boolean {
  const loc     = jobLocation.toLowerCase();
  const country = userCountry.toLowerCase();
  if (!loc || loc.includes('worldwide') || loc.includes('anywhere') || loc === 'remote') return true;
  if (country.includes('united states') || country.includes('usa') || country === 'us') {
    return loc.includes('usa') || loc.includes('us') || loc.includes('united states') ||
           loc.includes('north america') || loc.includes('america');
  }
  if (country.includes('united kingdom') || country === 'uk') {
    return loc.includes('uk') || loc.includes('united kingdom') || loc.includes('europe') || loc.includes('britain');
  }
  if (country.includes('canada'))    return loc.includes('canada') || loc.includes('north america');
  if (country.includes('australia')) return loc.includes('australia') || loc.includes('apac');
  return loc.includes(country.split(' ')[0]);
}

function scoreJobBySkills(title: string, description: string, skills: string[]): number {
  const haystack = `${title} ${description}`.toLowerCase();
  return skills.reduce((n, skill) => n + (haystack.includes(skill.toLowerCase()) ? 1 : 0), 0);
}

const STOP_WORDS = new Set(['and','or','the','a','an','for','of','in','at','to','with','level','mid','senior','junior','lead','staff','principal','sr','jr']);

function roleKeywords(roleType: string): string[] {
  return roleType
    .toLowerCase()
    .split(/[\s\/\-]+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function buildQueries(roleType: string, skills: string[]): string[] {
  const keywords = roleKeywords(roleType);
  const queries: string[] = [];
  if (roleType.trim()) queries.push(roleType);
  if (keywords.length >= 2) {
    queries.push(keywords.slice(0, 2).join(' '));
    queries.push(keywords[keywords.length - 1]);
  } else if (keywords.length === 1) {
    queries.push(keywords[0]);
  }
  for (const skill of skills.slice(0, 4)) {
    if (skill.length > 2) queries.push(skill);
  }
  return [...new Set(queries)];
}

// ── Source fetchers ──────────────────────────────────────────────────────────

async function fetchRemotive(query: string): Promise<JobResult[]> {
  const data = await fetch(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=100`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ jobs: [] }));

  return (data.jobs ?? []).map((j: Record<string, string>) => ({
    id:       `remotive-${j.id}`,
    title:    j.title,
    company:  j.company_name,
    location: j.candidate_required_location || 'Remote',
    url:      j.url,
    description: stripHtml(j.description ?? '').slice(0, 600),
    salary:   j.salary || '',
    postedAt: j.publication_date,
  }));
}

async function fetchRemoteOK(query: string): Promise<JobResult[]> {
  const data = await fetch(
    `https://remoteok.com/api?tag=${encodeURIComponent(query.split(' ')[0])}`,
    { cache: 'no-store', headers: { 'User-Agent': 'ResumeOS/1.0' } }
  ).then(r => r.json()).catch(() => []);

  return (Array.isArray(data) ? data : [])
    .filter((j: Record<string, string>) => j.id && j.position)
    .map((j: Record<string, string>) => ({
      id:       `remoteok-${j.id}`,
      title:    j.position,
      company:  j.company,
      location: j.location || 'Remote',
      url:      j.url,
      description: stripHtml(j.description ?? '').slice(0, 600),
      salary:   j.salary || '',
      postedAt: j.date,
    }));
}

async function fetchArbeitNow(query: string): Promise<JobResult[]> {
  const data = await fetch(
    `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ data: [] }));

  return (data.data ?? []).map((j: Record<string, string>) => ({
    id:       `arbeit-${j.slug}`,
    title:    j.title,
    company:  j.company_name,
    location: j.location || 'Remote',
    url:      j.url,
    description: stripHtml(j.description ?? '').slice(0, 600),
    salary:   '',
    postedAt: j.created_at,
  }));
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { skills, roleType, country, limit }: {
      skills: string[];
      roleType?: string;
      country?: string;
      limit?: number;
    } = await req.json();

    const jobLimit = Math.min(100, Math.max(1, limit ?? 25));

    if (!roleType?.trim() && !skills?.length) {
      return NextResponse.json({ error: 'Role type or skills required' }, { status: 400 });
    }

    const { allowed } = await checkAndUse('searches');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Job search limit reached for this month.', limitReached: true },
        { status: 403 },
      );
    }

    // Get already-tailored job URLs from DB
    const tailoredUrls = new Set(
      (await appQueries.list()).map(a => a.url).filter(Boolean) as string[]
    );

    const userCountry = country ?? 'United States';
    const searchQueries = buildQueries(roleType ?? '', skills ?? []);
    const kwds = roleKeywords(roleType ?? '');

    // Fan out across all sources in parallel
    const [remotiveResults, remoteOKResults, arbeitResults] = await Promise.all([
      Promise.all(searchQueries.map(q => fetchRemotive(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 3).map(q => fetchRemoteOK(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 3).map(q => fetchArbeitNow(q))).then(r => r.flat()),
    ]);

    const allJobs = [...remotiveResults, ...remoteOKResults, ...arbeitResults];

    // Merge + deduplicate by ID and URL
    const seenIds  = new Set<string>();
    const seenUrls = new Set<string>();
    const raw: JobResult[] = [];

    for (const j of allJobs) {
      if (seenIds.has(j.id) || seenUrls.has(j.url)) continue;
      seenIds.add(j.id);
      seenUrls.add(j.url);

      const skillScore    = scoreJobBySkills(j.title, j.description, skills ?? []);
      const descScore     = (skills ?? []).reduce((n, s) => n + (j.description.toLowerCase().includes(s.toLowerCase()) ? 1 : 0), 0);
      const titleHitsRole = kwds.some(kw => j.title.toLowerCase().includes(kw));

      if (!titleHitsRole && skillScore === 0 && descScore === 0) continue;

      raw.push({
        ...j,
        locationMatch:   matchesCountry(j.location, userCountry),
        skillScore,
        alreadyTailored: tailoredUrls.has(j.url),
      });
    }

    // Sort: not-tailored first → location match → skill score → most recent
    raw.sort((a, b) => {
      if (a.alreadyTailored !== b.alreadyTailored) return a.alreadyTailored ? 1 : -1;
      if (a.locationMatch   !== b.locationMatch)   return a.locationMatch   ? -1 : 1;
      if (b.skillScore      !== a.skillScore)       return b.skillScore - a.skillScore;
      return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
    });

    const result = raw.slice(0, jobLimit);

    // Persist to history
    for (const j of result) {
      try {
        await pulledJobQueries.upsert(j.id, j.title, j.company, j.location, j.url, j.salary ?? null, j.postedAt ?? null, j.skillScore);
      } catch { /* ignore individual failures */ }
    }

    return NextResponse.json({ jobs: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 });
  }
}
