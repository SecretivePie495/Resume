import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PLANS, type PlanId } from './plans';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const db = new Database(path.join(DB_DIR, 'resume-os.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS base_resume (
    id   INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    notes TEXT,
    resume_json TEXT,
    resume_html TEXT,
    cover_letter TEXT,
    ats_score INTEGER,
    ats_keywords TEXT,
    url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    applied_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Safe migrations
try { db.exec('ALTER TABLE applications ADD COLUMN url TEXT'); } catch { /* already exists */ }
try { db.exec('ALTER TABLE applications ADD COLUMN company_new TEXT'); db.exec('UPDATE applications SET company_new = company'); db.exec('ALTER TABLE applications DROP COLUMN company'); db.exec('ALTER TABLE applications RENAME COLUMN company_new TO company'); } catch { /* already nullable */ }
try { db.exec('ALTER TABLE applications ADD COLUMN job_title_new TEXT'); db.exec('UPDATE applications SET job_title_new = job_title'); db.exec('ALTER TABLE applications DROP COLUMN job_title'); db.exec('ALTER TABLE applications RENAME COLUMN job_title_new TO job_title'); } catch { /* already nullable */ }
try { db.exec('ALTER TABLE applications ADD COLUMN job_description_new TEXT'); db.exec('UPDATE applications SET job_description_new = job_description'); db.exec('ALTER TABLE applications DROP COLUMN job_description'); db.exec('ALTER TABLE applications RENAME COLUMN job_description_new TO job_description'); } catch { /* already nullable */ }

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

export const queries = {
  list: db.prepare<[], Application>('SELECT * FROM applications ORDER BY created_at DESC'),
  get: db.prepare<[number], Application>('SELECT * FROM applications WHERE id = ?'),
  insert: db.prepare<
    [string | null, string | null, string | null, string, string | null, string | null, number | null, string | null, string | null],
    { lastInsertRowid: number }
  >(
    `INSERT INTO applications (company, job_title, job_description, resume_json, resume_html, cover_letter, ats_score, ats_keywords, url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')`
  ),
  updateStatus: db.prepare<[string, string | null, string | null, number], void>(
    `UPDATE applications SET status = ?, notes = ?, applied_at = CASE WHEN ? = 'applied' THEN datetime('now') ELSE applied_at END, updated_at = datetime('now') WHERE id = ?`
  ),
  updateCoverLetter: db.prepare<[string, number], void>(
    `UPDATE applications SET cover_letter = ?, updated_at = datetime('now') WHERE id = ?`
  ),
  delete: db.prepare<[number], void>('DELETE FROM applications WHERE id = ?'),
};

// ── Settings / Usage ────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id            INTEGER PRIMARY KEY,
    plan          TEXT    NOT NULL DEFAULT 'free',
    resumes_used  INTEGER NOT NULL DEFAULT 0,
    searches_used INTEGER NOT NULL DEFAULT 0,
    covers_used   INTEGER NOT NULL DEFAULT 0,
    extra_resumes INTEGER NOT NULL DEFAULT 0,
    reset_at      TEXT    NOT NULL DEFAULT (date('now','start of month','+1 month'))
  );
  INSERT OR IGNORE INTO settings (id) VALUES (1);
`);

interface SettingsRow {
  plan: PlanId;
  resumes_used: number;
  searches_used: number;
  covers_used: number;
  extra_resumes: number;
  reset_at: string;
}

const _getSettings  = db.prepare<[], SettingsRow>('SELECT plan,resumes_used,searches_used,covers_used,extra_resumes,reset_at FROM settings WHERE id=1');
const _resetCounts  = db.prepare<[string], void>('UPDATE settings SET resumes_used=0,searches_used=0,covers_used=0,reset_at=? WHERE id=1');
const _incResumes   = db.prepare<[], void>('UPDATE settings SET resumes_used=resumes_used+1 WHERE id=1');
const _incSearches  = db.prepare<[], void>('UPDATE settings SET searches_used=searches_used+1 WHERE id=1');
const _incCovers    = db.prepare<[], void>('UPDATE settings SET covers_used=covers_used+1 WHERE id=1');
const _addExtras    = db.prepare<[number], void>('UPDATE settings SET extra_resumes=extra_resumes+? WHERE id=1');
const _setPlan      = db.prepare<[string], void>('UPDATE settings SET plan=? WHERE id=1');

function maybeReset(row: SettingsRow): SettingsRow {
  if (new Date() >= new Date(row.reset_at)) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1, 1);
    const iso = nextReset.toISOString().split('T')[0];
    _resetCounts.run(iso);
    return { ...row, resumes_used: 0, searches_used: 0, covers_used: 0, reset_at: iso };
  }
  return row;
}

export function getUsage(): SettingsRow & { plan_def: typeof PLANS[PlanId] } {
  const row = maybeReset(_getSettings.get()!);
  return { ...row, plan_def: PLANS[row.plan] };
}

export type UsageType = 'resumes' | 'searches' | 'covers';

export function checkAndUse(type: UsageType): { allowed: boolean; remaining: number } {
  if (process.env.OWNER_MODE === 'true') return { allowed: true, remaining: 99999 };

  const row = maybeReset(_getSettings.get()!);
  const plan = PLANS[row.plan];

  if (type === 'resumes') {
    const ceiling = plan.resumes + row.extra_resumes;
    if (row.resumes_used >= ceiling) return { allowed: false, remaining: 0 };
    _incResumes.run();
    return { allowed: true, remaining: ceiling - row.resumes_used - 1 };
  }

  if (type === 'searches') {
    if (plan.searches === -1) return { allowed: true, remaining: -1 };
    if (row.searches_used >= plan.searches) return { allowed: false, remaining: 0 };
    _incSearches.run();
    return { allowed: true, remaining: plan.searches - row.searches_used - 1 };
  }

  // covers
  if (row.covers_used >= plan.covers) return { allowed: false, remaining: 0 };
  _incCovers.run();
  return { allowed: true, remaining: plan.covers - row.covers_used - 1 };
}

export function addExtraResumes(count: number) { _addExtras.run(count); }
export function setPlanId(planId: PlanId)      { _setPlan.run(planId); }

export const resumeQueries = {
  get: db.prepare<[], { content: string } | undefined>('SELECT content FROM base_resume WHERE id = 1'),
  upsert: db.prepare<[string], void>(
    `INSERT INTO base_resume (id, content, updated_at) VALUES (1, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
  ),
};

export default db;
