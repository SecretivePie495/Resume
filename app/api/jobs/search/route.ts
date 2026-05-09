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

type RawJob = Omit<JobResult, 'locationMatch' | 'skillScore' | 'alreadyTailored'>;

// ── Source fetchers ──────────────────────────────────────────────────────────

async function fetchRemotive(query: string): Promise<RawJob[]> {
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

async function fetchRemoteOK(query: string): Promise<RawJob[]> {
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

async function fetchArbeitNow(query: string): Promise<RawJob[]> {
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

async function fetchTheMuse(query: string): Promise<RawJob[]> {
  const data = await fetch(
    `https://www.themuse.com/api/public/jobs?page=0&descending=true&category=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ results: [] }));

  return (data.results ?? []).map((j: Record<string, unknown>) => {
    const loc = (j.locations as { name: string }[] | undefined)?.[0]?.name ?? 'Remote';
    const company = (j.company as { name: string } | undefined)?.name ?? '';
    const refs = (j.refs as { landing_page?: string } | undefined);
    return {
      id:          `muse-${j.id}`,
      title:       j.name as string,
      company,
      location:    loc,
      url:         refs?.landing_page ?? `https://www.themuse.com/jobs/${j.id}`,
      description: stripHtml((j.contents as string) ?? '').slice(0, 600),
      salary:      '',
      postedAt:    j.publication_date as string | undefined,
    };
  });
}

async function fetchJobicy(query: string): Promise<RawJob[]> {
  const tag = query.split(' ')[0];
  const data = await fetch(
    `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ jobs: [] }));

  return (data.jobs ?? []).map((j: Record<string, string>) => ({
    id:          `jobicy-${j.id}`,
    title:       j.jobTitle,
    company:     j.companyName,
    location:    j.jobGeo || 'Remote',
    url:         j.url,
    description: stripHtml(j.jobExcerpt ?? '').slice(0, 600),
    salary:      j.annualSalaryMin ? `$${j.annualSalaryMin}–$${j.annualSalaryMax}` : '',
    postedAt:    j.pubDate,
  }));
}

async function fetchAiJobsNet(query: string): Promise<RawJob[]> {
  const rss = await fetch(
    `https://ai-jobs.net/feed/?s=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  ).then(r => r.text()).catch(() => '');

  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map((m, i) => {
    const get = (tag: string) => m[1].match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim()
      ?? m[1].match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))?.[1]?.trim() ?? '';
    return {
      id:          `aijobs-${i}-${Date.now()}`,
      title:       get('title'),
      company:     get('author') || get('dc:creator') || 'Unknown',
      location:    get('location') || 'Remote',
      url:         get('link'),
      description: stripHtml(get('description')).slice(0, 600),
      salary:      '',
      postedAt:    get('pubDate') ? new Date(get('pubDate')).toISOString() : undefined,
    };
  }).filter(j => j.title && j.url);
}

async function fetchHimalayas(query: string): Promise<RawJob[]> {
  const data = await fetch(
    `https://himalayas.app/api/jobs?q=${encodeURIComponent(query)}&limit=50`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => ({ jobs: [] }));

  return (data.jobs ?? []).map((j: Record<string, string>) => ({
    id:          `himalayas-${j.slug ?? j.id}`,
    title:       j.title,
    company:     j.companyName ?? j.company,
    location:    j.locationRestrictions ?? j.location ?? 'Remote',
    url:         j.applicationLink ?? `https://himalayas.app/jobs/${j.slug}`,
    description: stripHtml(j.description ?? '').slice(0, 600),
    salary:      j.salaryCurrency && j.salaryMin ? `${j.salaryCurrency}${j.salaryMin}–${j.salaryMax}` : '',
    postedAt:    j.createdAt,
  }));
}

async function fetchWeWorkRemotely(query: string): Promise<RawJob[]> {
  const rss = await fetch(
    `https://weworkremotely.com/remote-jobs/search.json?term=${encodeURIComponent(query)}`,
    { cache: 'no-store', headers: { 'User-Agent': 'ResumeOS/1.0' } }
  ).then(r => r.json()).catch(() => []);

  return (Array.isArray(rss) ? rss : []).map((j: Record<string, string>) => ({
    id:          `wwr-${j.id}`,
    title:       j.title,
    company:     j.company,
    location:    j.region || 'Remote',
    url:         j.url?.startsWith('http') ? j.url : `https://weworkremotely.com${j.url}`,
    description: stripHtml(j.description ?? '').slice(0, 600),
    salary:      '',
    postedAt:    j.date,
  }));
}

async function fetchWorkingNomads(query: string): Promise<RawJob[]> {
  const data = await fetch(
    `https://www.workingnomads.com/api/exposed_jobs/?search=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => []);

  return (Array.isArray(data) ? data : []).map((j: Record<string, string>) => ({
    id:          `nomads-${j.id}`,
    title:       j.title,
    company:     j.company_name,
    location:    j.location || 'Remote',
    url:         j.url,
    description: stripHtml(j.description ?? '').slice(0, 600),
    salary:      '',
    postedAt:    j.pub_date,
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

    // Fan out across all sources in parallel
    const [
      remotiveResults, remoteOKResults, arbeitResults, museResults, jobicyResults,
      aiJobsResults, himalayasResults, wwrResults, nomadsResults,
    ] = await Promise.all([
      Promise.all(searchQueries.map(q => fetchRemotive(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 3).map(q => fetchRemoteOK(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 3).map(q => fetchArbeitNow(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchTheMuse(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchJobicy(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchAiJobsNet(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchHimalayas(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchWeWorkRemotely(q))).then(r => r.flat()),
      Promise.all(searchQueries.slice(0, 2).map(q => fetchWorkingNomads(q))).then(r => r.flat()),
    ]);

    const allJobs = [
      ...remotiveResults, ...remoteOKResults, ...arbeitResults, ...museResults, ...jobicyResults,
      ...aiJobsResults, ...himalayasResults, ...wwrResults, ...nomadsResults,
    ];

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
