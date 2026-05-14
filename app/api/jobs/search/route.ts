import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

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
  source: string;
  matchedSkills: string[];
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

type RawJob = Omit<JobResult, 'locationMatch' | 'skillScore' | 'alreadyTailored' | 'matchedSkills'>;

// ── Source fetchers ──────────────────────────────────────────────────────────

async function fetchLinkedIn(query: string, country: string, count: number): Promise<RawJob[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return [];

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(country)}&position=1&pageNum=0`;

  const data = await fetch(
    `https://api.apify.com/v2/acts/hKByXkMQaC5Qt9UMN/run-sync-get-dataset-items?token=${token}&timeout=90`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [searchUrl],
        scrapeCompany: true,
        count: Math.max(10, count),
        splitByLocation: false,
      }),
      cache: 'no-store',
    }
  ).then(r => r.json()).catch(() => []);

  return (Array.isArray(data) ? data : []).map((j: Record<string, string>) => ({
    id:          `linkedin-${j.id ?? j.jobId ?? j.trackingId}`,
    title:       j.title,
    company:     j.companyName ?? j.company,
    location:    j.location ?? 'Remote',
    url:         j.link ?? j.jobUrl ?? j.url,
    description: stripHtml(j.descriptionHtml ?? j.descriptionText ?? j.description ?? '').slice(0, 600),
    salary:      j.salary ?? '',
    postedAt:    j.postedAt ?? j.listedAt,
    source:      'LinkedIn',
  })).filter(j => j.title && j.url);
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

    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { checkAndUse, queries: appQueries, pulledJobQueries } = createDb(userId);

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

    const allJobs = await fetchLinkedIn(roleType ?? searchQueries[0], userCountry, jobLimit);

    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // Merge + deduplicate by ID and URL
    const seenIds  = new Set<string>();
    const seenUrls = new Set<string>();
    const raw: JobResult[] = [];

    for (const j of allJobs) {
      if (seenIds.has(j.id) || seenUrls.has(j.url)) continue;
      if (j.postedAt && new Date(j.postedAt).getTime() < cutoff) continue;
      seenIds.add(j.id);
      seenUrls.add(j.url);

      const haystack      = `${j.title} ${j.description}`.toLowerCase();
      const matchedSkills = (skills ?? []).filter(s => haystack.includes(s.toLowerCase()));
      const skillScore    = matchedSkills.length;
      const titleHitsRole = kwds.some(kw => j.title.toLowerCase().includes(kw));

      if (!titleHitsRole && skillScore === 0) continue;

      raw.push({
        ...j,
        locationMatch:   matchesCountry(j.location, userCountry),
        skillScore,
        matchedSkills,
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
