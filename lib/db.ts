import { neon } from '@neondatabase/serverless';
import { PLANS, type PlanId } from './plans';

const sql = neon(process.env.DATABASE_URL!);

// ── Schema init (called from instrumentation.ts on server start) ─────────────

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS base_resume (
      id         INTEGER PRIMARY KEY,
      content    TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id              SERIAL PRIMARY KEY,
      company         TEXT,
      job_title       TEXT,
      job_description TEXT,
      status          TEXT NOT NULL DEFAULT 'generated',
      notes           TEXT,
      resume_json     TEXT,
      resume_html     TEXT,
      cover_letter    TEXT,
      ats_score       INTEGER,
      ats_keywords    TEXT,
      url             TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      applied_at      TIMESTAMPTZ,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id            INTEGER PRIMARY KEY,
      plan          TEXT    NOT NULL DEFAULT 'free',
      resumes_used  INTEGER NOT NULL DEFAULT 0,
      searches_used INTEGER NOT NULL DEFAULT 0,
      covers_used   INTEGER NOT NULL DEFAULT 0,
      extra_resumes INTEGER NOT NULL DEFAULT 0,
      inbox_addon   INTEGER NOT NULL DEFAULT 0,
      reset_at      DATE    NOT NULL DEFAULT ((date_trunc('month', NOW()) + INTERVAL '1 month')::date)
    )`;

  await sql`INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING`;

  await sql`
    CREATE TABLE IF NOT EXISTS pulled_jobs (
      id          SERIAL PRIMARY KEY,
      external_id TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      company     TEXT NOT NULL,
      location    TEXT NOT NULL,
      url         TEXT NOT NULL,
      salary      TEXT,
      posted_at   TEXT,
      pulled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      skill_score INTEGER NOT NULL DEFAULT 0
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_resumes (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS gmail_tokens (
      id            INTEGER PRIMARY KEY,
      access_token  TEXT,
      refresh_token TEXT NOT NULL,
      expiry        TEXT
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS job_emails (
      id             SERIAL PRIMARY KEY,
      gmail_id       TEXT NOT NULL UNIQUE,
      from_email     TEXT NOT NULL,
      from_name      TEXT,
      subject        TEXT NOT NULL,
      snippet        TEXT,
      body           TEXT,
      received_at    TIMESTAMPTZ NOT NULL,
      application_id INTEGER REFERENCES applications(id),
      label          TEXT,
      is_read        INTEGER NOT NULL DEFAULT 0
    )`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'generated'
  | 'not_applied'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected';

export interface Application {
  id: number;
  company: string | null;
  job_title: string | null;
  job_description: string | null;
  status: ApplicationStatus;
  notes: string | null;
  resume_json: string | null;
  resume_html: string | null;
  cover_letter: string | null;
  ats_score: number | null;
  ats_keywords: string | null;
  url: string | null;
  created_at: string;
  applied_at: string | null;
  updated_at: string;
}

// ── Applications ─────────────────────────────────────────────────────────────

export const queries = {
  list: () =>
    sql`SELECT * FROM applications ORDER BY created_at DESC` as unknown as Promise<Application[]>,

  get: async (id: number): Promise<Application | undefined> => {
    const rows = await sql`SELECT * FROM applications WHERE id = ${id}`;
    return rows[0] as Application | undefined;
  },

  insert: async (
    company: string | null, jobTitle: string | null, jd: string | null,
    resumeJson: string | null, resumeHtml: string | null, coverLetter: string | null,
    atsScore: number | null, atsKeywords: string | null, url: string | null,
  ): Promise<{ id: number }> => {
    const rows = await sql`
      INSERT INTO applications
        (company, job_title, job_description, resume_json, resume_html, cover_letter,
         ats_score, ats_keywords, url, status)
      VALUES
        (${company}, ${jobTitle}, ${jd}, ${resumeJson}, ${resumeHtml}, ${coverLetter},
         ${atsScore}, ${atsKeywords}, ${url}, 'generated')
      RETURNING id`;
    return { id: rows[0].id as number };
  },

  updateStatus: (status: string, notes: string | null, id: number) => sql`
    UPDATE applications
    SET status     = ${status},
        notes      = ${notes},
        applied_at = CASE WHEN ${status} = 'applied' THEN NOW() ELSE applied_at END,
        updated_at = NOW()
    WHERE id = ${id}`,

  updateCoverLetter: (coverLetter: string, id: number) => sql`
    UPDATE applications SET cover_letter = ${coverLetter}, updated_at = NOW() WHERE id = ${id}`,

  delete: (id: number) => sql`DELETE FROM applications WHERE id = ${id}`,
};

// ── Settings / Usage ─────────────────────────────────────────────────────────

interface SettingsRow {
  plan: PlanId;
  resumes_used: number;
  searches_used: number;
  covers_used: number;
  extra_resumes: number;
  inbox_addon: number;
  reset_at: string;
}

async function maybeReset(row: SettingsRow): Promise<SettingsRow> {
  if (new Date() >= new Date(row.reset_at)) {
    const next = new Date();
    next.setMonth(next.getMonth() + 1, 1);
    const iso = next.toISOString().split('T')[0];
    await sql`UPDATE settings SET resumes_used=0, searches_used=0, covers_used=0, reset_at=${iso} WHERE id=1`;
    return { ...row, resumes_used: 0, searches_used: 0, covers_used: 0, reset_at: iso };
  }
  return row;
}

export async function getUsage() {
  const rows = await sql`
    SELECT plan, resumes_used, searches_used, covers_used, extra_resumes, inbox_addon, reset_at
    FROM settings WHERE id = 1`;
  const row = await maybeReset(rows[0] as SettingsRow);
  return { ...row, plan_def: PLANS[row.plan] };
}

export type UsageType = 'resumes' | 'searches' | 'covers';

export async function checkAndUse(type: UsageType): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.OWNER_MODE === 'true') return { allowed: true, remaining: 99999 };

  const rows = await sql`
    SELECT plan, resumes_used, searches_used, covers_used, extra_resumes, inbox_addon, reset_at
    FROM settings WHERE id = 1`;
  const row  = await maybeReset(rows[0] as SettingsRow);
  const plan = PLANS[row.plan];

  if (type === 'resumes') {
    const ceiling = plan.resumes + row.extra_resumes;
    if (row.resumes_used >= ceiling) return { allowed: false, remaining: 0 };
    await sql`UPDATE settings SET resumes_used = resumes_used + 1 WHERE id = 1`;
    return { allowed: true, remaining: ceiling - row.resumes_used - 1 };
  }
  if (type === 'searches') {
    if (plan.searches === -1) return { allowed: true, remaining: -1 };
    if (row.searches_used >= plan.searches) return { allowed: false, remaining: 0 };
    await sql`UPDATE settings SET searches_used = searches_used + 1 WHERE id = 1`;
    return { allowed: true, remaining: plan.searches - row.searches_used - 1 };
  }
  if (row.covers_used >= plan.covers) return { allowed: false, remaining: 0 };
  await sql`UPDATE settings SET covers_used = covers_used + 1 WHERE id = 1`;
  return { allowed: true, remaining: plan.covers - row.covers_used - 1 };
}

export async function addExtraResumes(count: number) {
  await sql`UPDATE settings SET extra_resumes = extra_resumes + ${count} WHERE id = 1`;
}

export async function setPlanId(planId: PlanId) {
  await sql`UPDATE settings SET plan = ${planId} WHERE id = 1`;
}

export async function hasInboxAccess(): Promise<boolean> {
  if (process.env.OWNER_MODE === 'true') return true;
  const rows = await sql`SELECT plan, inbox_addon FROM settings WHERE id = 1`;
  const row = rows[0] as { plan: PlanId; inbox_addon: number };
  return PLANS[row.plan].inbox || row.inbox_addon === 1;
}

// ── Base Resume ──────────────────────────────────────────────────────────────

export const resumeQueries = {
  get: async (): Promise<{ content: string } | undefined> => {
    const rows = await sql`SELECT content FROM base_resume WHERE id = 1`;
    return rows[0] as { content: string } | undefined;
  },

  upsert: (content: string) => sql`
    INSERT INTO base_resume (id, content, updated_at) VALUES (1, ${content}, NOW())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
};

// ── Pulled Jobs ──────────────────────────────────────────────────────────────

export interface PulledJob {
  id: number;
  external_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salary: string | null;
  posted_at: string | null;
  pulled_at: string;
  skill_score: number;
}

export const pulledJobQueries = {
  list: () =>
    sql`SELECT * FROM pulled_jobs ORDER BY pulled_at DESC` as unknown as Promise<PulledJob[]>,

  upsert: (
    externalId: string, title: string, company: string, location: string,
    url: string, salary: string | null, postedAt: string | null, skillScore: number,
  ) => sql`
    INSERT INTO pulled_jobs (external_id, title, company, location, url, salary, posted_at, skill_score)
    VALUES (${externalId}, ${title}, ${company}, ${location}, ${url}, ${salary}, ${postedAt}, ${skillScore})
    ON CONFLICT (external_id) DO UPDATE SET
      skill_score = EXCLUDED.skill_score,
      pulled_at   = NOW()`,
};

// ── Saved Resumes ────────────────────────────────────────────────────────────

export interface SavedResume {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

export const savedResumeQueries = {
  list: () =>
    sql`SELECT id, name, content, created_at FROM saved_resumes ORDER BY created_at DESC` as unknown as Promise<SavedResume[]>,

  get: async (id: number): Promise<SavedResume | undefined> => {
    const rows = await sql`SELECT id, name, content, created_at FROM saved_resumes WHERE id = ${id}`;
    return rows[0] as SavedResume | undefined;
  },

  insert: async (name: string, content: string): Promise<{ id: number }> => {
    const rows = await sql`INSERT INTO saved_resumes (name, content) VALUES (${name}, ${content}) RETURNING id`;
    return { id: rows[0].id as number };
  },

  delete: (id: number) => sql`DELETE FROM saved_resumes WHERE id = ${id}`,
};

// ── Gmail ────────────────────────────────────────────────────────────────────

export interface GmailToken {
  id: number;
  access_token: string | null;
  refresh_token: string;
  expiry: string | null;
}

export const gmailTokenQueries = {
  get: async (): Promise<GmailToken | undefined> => {
    const rows = await sql`SELECT * FROM gmail_tokens WHERE id = 1`;
    return rows[0] as GmailToken | undefined;
  },

  upsert: (accessToken: string, refreshToken: string, expiry: string) => sql`
    INSERT INTO gmail_tokens (id, access_token, refresh_token, expiry)
    VALUES (1, ${accessToken}, ${refreshToken}, ${expiry})
    ON CONFLICT (id) DO UPDATE SET
      access_token  = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expiry        = EXCLUDED.expiry`,

  delete: () => sql`DELETE FROM gmail_tokens WHERE id = 1`,
};

export interface JobEmail {
  id: number;
  gmail_id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  snippet: string | null;
  body: string | null;
  received_at: string;
  application_id: number | null;
  label: string | null;
  is_read: number;
}

export const jobEmailQueries = {
  list: () =>
    sql`SELECT * FROM job_emails ORDER BY received_at DESC` as unknown as Promise<JobEmail[]>,

  upsert: (
    gmailId: string, fromEmail: string, fromName: string | null,
    subject: string, snippet: string | null, body: string | null,
    receivedAt: string, applicationId: number | null, label: string | null,
  ) => sql`
    INSERT INTO job_emails
      (gmail_id, from_email, from_name, subject, snippet, body, received_at, application_id, label)
    VALUES
      (${gmailId}, ${fromEmail}, ${fromName}, ${subject}, ${snippet}, ${body},
       ${receivedAt}, ${applicationId}, ${label})
    ON CONFLICT (gmail_id) DO UPDATE SET
      application_id = COALESCE(EXCLUDED.application_id, job_emails.application_id),
      label          = COALESCE(EXCLUDED.label, job_emails.label)`,

  markRead: (gmailId: string) => sql`UPDATE job_emails SET is_read = 1 WHERE gmail_id = ${gmailId}`,

  unread: async (): Promise<number> => {
    const rows = await sql`SELECT COUNT(*) AS count FROM job_emails WHERE is_read = 0`;
    return Number(rows[0].count);
  },

  deleteSamples: () => sql`DELETE FROM job_emails WHERE gmail_id LIKE 'seed-%'`,
};
