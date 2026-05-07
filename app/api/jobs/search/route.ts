import { NextRequest, NextResponse } from 'next/server';
import { checkAndUse } from '@/lib/db';

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

// Extract meaningful keywords from a role type string
const STOP_WORDS = new Set(['and','or','the','a','an','for','of','in','at','to','with','level','mid','senior','junior','lead','staff','principal','sr','jr']);

function roleKeywords(roleType: string): string[] {
  return roleType
    .toLowerCase()
    .split(/[\s\/\-]+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Build search queries: role phrase + individual keywords + top skills for broad coverage
function buildQueries(roleType: string, skills: string[]): string[] {
  const keywords = roleKeywords(roleType);
  const queries: string[] = [];

  if (roleType.trim()) queries.push(roleType);

  // keyword pairs and individual job-family words
  if (keywords.length >= 2) {
    queries.push(keywords.slice(0, 2).join(' '));
    queries.push(keywords[keywords.length - 1]);
  } else if (keywords.length === 1) {
    queries.push(keywords[0]);
  }

  // also fan out on the top 4 skills individually for much broader coverage
  for (const skill of skills.slice(0, 4)) {
    if (skill.length > 2) queries.push(skill);
  }

  return [...new Set(queries)];
}

export async function POST(req: NextRequest) {
  try {
    const { skills, roleType, country }: {
      skills: string[];
      roleType?: string;
      country?: string;
    } = await req.json();

    if (!roleType?.trim() && !skills?.length) {
      return NextResponse.json({ error: 'Role type or skills required' }, { status: 400 });
    }

    const { allowed } = checkAndUse('searches');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Job search limit reached for this month.', limitReached: true },
        { status: 403 },
      );
    }

    const userCountry = country ?? 'United States';
    const queries     = buildQueries(roleType ?? '', skills ?? []);
    const kwds        = roleKeywords(roleType ?? '');

    // Fan out all queries in parallel
    const responses = await Promise.all(
      queries.map(q =>
        fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=100`, { cache: 'no-store' })
          .then(r => r.json())
          .then(d => d.jobs ?? [])
          .catch(() => [])
      )
    );

    // Merge + deduplicate
    const seen = new Set<string>();
    const raw: JobResult[] = [];

    for (const jobs of responses) {
      for (const j of jobs) {
        const id = String(j.id);
        if (seen.has(id)) continue;
        seen.add(id);

        const title       = j.title as string;
        const description = stripHtml(j.description ?? '');
        const skillScore  = scoreJobBySkills(title, description, skills ?? []);

        // Keep all jobs that come back — the skill score and filters on the
        // frontend handle relevance ranking. Only hard-exclude jobs where the
        // role keywords AND skills both score zero against the description.
        const descScore = (skills ?? []).reduce(
          (n, s) => n + (description.toLowerCase().includes(s.toLowerCase()) ? 1 : 0), 0
        );
        const titleHitsRole = kwds.some(kw => title.toLowerCase().includes(kw));
        if (!titleHitsRole && skillScore === 0 && descScore === 0) continue;

        raw.push({
          id,
          title,
          company:       j.company_name,
          location:      j.candidate_required_location || 'Remote',
          url:           j.url,
          description:   description.slice(0, 600),
          salary:        j.salary || '',
          postedAt:      j.publication_date,
          locationMatch: matchesCountry(j.candidate_required_location ?? '', userCountry),
          skillScore,
        });
      }
    }

    // Sort: location match → skill score desc → most recent
    raw.sort((a, b) => {
      if (a.locationMatch !== b.locationMatch) return a.locationMatch ? -1 : 1;
      if (b.skillScore !== a.skillScore) return b.skillScore - a.skillScore;
      return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
    });

    return NextResponse.json({ jobs: raw.slice(0, 80) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 });
  }
}
