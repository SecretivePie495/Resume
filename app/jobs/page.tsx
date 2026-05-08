'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Application, ApplicationStatus, PulledJob, JobEmail } from '@/lib/db';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  generated:    'bg-slate-100 text-slate-600',
  not_applied:  'bg-slate-100 text-slate-500',
  applied:      'bg-blue-100 text-blue-700',
  interviewing: 'bg-amber-100 text-amber-700',
  offer:        'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  generated:    'Generated',
  not_applied:  'Not Applied',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
};

const ALL_STATUSES: ApplicationStatus[] = ['generated', 'not_applied', 'applied', 'interviewing', 'offer', 'rejected'];

interface PreviewState {
  app: Application;
  tab: 'resume' | 'cover';
}

function PreviewModal({ preview, onClose, onCoverGenerated }: {
  preview: PreviewState;
  onClose: () => void;
  onCoverGenerated: (appId: number, text: string) => void;
}) {
  const [tab, setTab] = useState<'resume' | 'cover'>(preview.tab);
  const [app, setApp] = useState(preview.app);
  const [coverLoading, setCoverLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateCover() {
    setCoverLoading(true);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id }),
      });
      const data = await res.json();
      const updated = { ...app, cover_letter: data.cover_letter };
      setApp(updated);
      onCoverGenerated(app.id, data.cover_letter);
      setTab('cover');
      window.dispatchEvent(new Event('resumeos:usage-updated'));
    } finally {
      setCoverLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{app.company ?? '—'}</h2>
            <p className="text-sm text-slate-500">{app.job_title ?? '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
              >
                Job Posting ↗
              </a>
            )}
            <Link
              href={`/preview/${app.id}`}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Full Page
            </Link>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 shrink-0">
          {(['resume', 'cover'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                tab === t
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {t === 'cover' ? 'Cover Letter' : 'Resume'}
            </button>
          ))}

        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {tab === 'resume' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
                <span className="text-xs text-slate-400">Resume Preview</span>
                <a
                  href={`/api/pdf?id=${app.id}`}
                  target="_blank"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors font-medium"
                >
                  Download PDF
                </a>
              </div>
              {app.resume_html ? (
                <iframe srcDoc={app.resume_html} className="flex-1 bg-white w-full" title="Resume" />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  No resume available.
                </div>
              )}
            </div>
          )}

          {tab === 'cover' && (
            <div className="h-full flex flex-col">
              {app.cover_letter ? (
                <>
                  <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
                    <span className="text-xs text-slate-400">Cover Letter</span>
                    <button
                      onClick={() => copyText(app.cover_letter!)}
                      className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-md transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy text'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto px-8 py-6">
                    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                      <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {app.cover_letter}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <p className="text-sm">No cover letter yet.</p>
                  <button
                    onClick={generateCover}
                    disabled={coverLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {coverLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : 'Generate Cover Letter'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface QAPair { question: string; answer: string; }

function QAPanel({ app, onClose }: { app: Application; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [pairs, setPairs]       = useState<QAPair[]>([]);
  const [copied, setCopied]     = useState<number | null>(null);
  const [error, setError]       = useState('');

  async function ask() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, appId: app.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      setPairs(prev => [{ question: q, answer: data.answer }, ...prev]);
      setQuestion('');
    } finally {
      setLoading(false);
    }
  }

  function copy(idx: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{app.company ?? '—'}</h2>
            <p className="text-sm text-slate-500">{app.job_title ?? '—'} · Application Q&A</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0 space-y-3">
          <p className="text-xs text-slate-400">Paste a question from the job application and get a first-person answer based on your tailored resume.</p>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
            placeholder="e.g. How many years of experience do you have with Python?"
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating answer...
              </span>
            ) : 'Get Answer  ⌘↵'}
          </button>
        </div>

        {/* Answers */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-5">
          {pairs.length === 0 && (
            <p className="text-sm text-slate-300 text-center pt-10">Answers will appear here</p>
          )}
          {pairs.map((p, i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3">{p.question}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Answer</p>
                <button
                  onClick={() => copy(i, p.answer)}
                  className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {copied === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-lg px-4 py-3">{p.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LABEL_STYLES: Record<string, string> = {
  interview:    'bg-amber-100 text-amber-700',
  offer:        'bg-green-100 text-green-700',
  rejection:    'bg-red-100 text-red-600',
  confirmation: 'bg-blue-100 text-blue-700',
  follow_up:    'bg-purple-100 text-purple-700',
  other:        'bg-slate-100 text-slate-500',
};
const LABEL_NAMES: Record<string, string> = {
  interview: 'Interview', offer: 'Offer', rejection: 'Rejected',
  confirmation: 'Confirmation', follow_up: 'Follow-up', other: 'Other',
};

function JobsPage() {
  const searchParams = useSearchParams();
  const [pageTab, setPageTab] = useState<'tailored' | 'history' | 'inbox'>(() => {
    return searchParams.get('tab') === 'inbox' ? 'inbox' : 'tailored';
  });
  const [apps, setApps] = useState<Application[]>([]);
  const [pulledJobs, setPulledJobs] = useState<(PulledJob & { alreadyTailored: boolean })[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [qaApp, setQaApp]     = useState<Application | null>(null);
  const [statusSaving, setStatusSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Inbox state
  const [inboxAccess, setInboxAccess]       = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [emails, setEmails]                 = useState<JobEmail[]>([]);
  const [emailLoading, setEmailLoading]     = useState(false);
  const [openEmail, setOpenEmail]           = useState<JobEmail | null>(null);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [replyOpen, setReplyOpen]           = useState(false);
  const [replyBody, setReplyBody]           = useState('');
  const [replySending, setReplySending]     = useState(false);
  const [replySent, setReplySent]           = useState(false);
  const [labelFilter, setLabelFilter]       = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res  = await fetch('/api/gmail/emails');
      const data = await res.json();
      if (res.ok) setEmails(data.emails ?? []);
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(setApps);
    fetch('/api/jobs/history').then(r => r.json()).then(d => setPulledJobs(d.jobs ?? []));
    fetch('/api/usage').then(r => r.json()).then(d => setInboxAccess(d.inboxAccess ?? false));
    fetch('/api/gmail/status').then(r => r.json()).then(d => {
      setGmailConnected(d.connected);
      setUnreadCount(d.unread ?? 0);
      if (d.connected && searchParams.get('tab') === 'inbox') fetchEmails();
    });
  }, [fetchEmails, searchParams]);

  async function sendReply() {
    if (!openEmail || !replyBody.trim()) return;
    setReplySending(true);
    try {
      await fetch('/api/gmail/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: openEmail.from_email, subject: openEmail.subject, body: replyBody }),
      });
      setReplySent(true);
      setReplyOpen(false);
      setReplyBody('');
    } finally {
      setReplySending(false);
    }
  }

  async function openEmailPanel(email: JobEmail) {
    setReplyOpen(false);
    setReplyBody('');
    setReplySent(false);
    setOpenEmail(email);
    if (!email.is_read) {
      await fetch('/api/gmail/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail_id: email.gmail_id }),
      });
      setEmails(prev => prev.map(e => e.gmail_id === email.gmail_id ? { ...e, is_read: 1 } : e));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  async function disconnectGmail() {
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    setGmailConnected(false);
    setEmails([]);
    setUnreadCount(0);
  }

  async function changeStatus(id: number, status: ApplicationStatus) {
    setStatusSaving(id);
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (preview?.app.id === id) setPreview(p => p ? { ...p, app: { ...p.app, status } } : null);
    setStatusSaving(null);
  }

  async function deleteApp(id: number) {
    setDeleting(id);
    await fetch(`/api/applications?id=${id}`, { method: 'DELETE' });
    setApps(prev => prev.filter(a => a.id !== id));
    if (preview?.app.id === id) setPreview(null);
    setDeleting(null);
  }

  async function deleteAll() {
    if (!confirm(`Delete all ${apps.length} applications? This cannot be undone.`)) return;
    await Promise.all(apps.map(a => fetch(`/api/applications?id=${a.id}`, { method: 'DELETE' })));
    setApps([]);
    setPreview(null);
  }

  function handleCoverGenerated(appId: number, text: string) {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, cover_letter: text } : a));
  }

  const counts = {
    total:        apps.length,
    applied:      apps.filter(a => ['applied', 'interviewing', 'offer'].includes(a.status)).length,
    interviewing: apps.filter(a => a.status === 'interviewing').length,
    offers:       apps.filter(a => a.status === 'offer').length,
  };

  return (
    <>
      {preview && (
        <PreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          onCoverGenerated={handleCoverGenerated}
        />
      )}
      {qaApp && <QAPanel app={qaApp} onClose={() => setQaApp(null)} />}

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Tailor</h1>
            <p className="text-slate-500 text-sm mt-1">
              All generated applications — preview, manage status, and export documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pageTab === 'tailored' && apps.length > 0 && (
              <button
                onClick={deleteAll}
                className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-2 rounded-lg transition-colors"
              >
                Delete All
              </button>
            )}
            <Link
              href="/generate"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              + Generate Resumes
            </Link>
          </div>
        </div>

        {/* Page tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([
            { key: 'tailored', label: 'Tailored Resumes' },
            { key: 'history',  label: `All Pulled Jobs${pulledJobs.length ? ` (${pulledJobs.length})` : ''}` },
            { key: 'inbox',    label: unreadCount > 0 ? `Inbox (${unreadCount})` : 'Inbox' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setPageTab(key);
                if (key === 'inbox' && gmailConnected && emails.length === 0) fetchEmails();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pageTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              } ${key === 'inbox' && unreadCount > 0 ? 'text-blue-600' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── History tab ─────────────────────────────────────────── */}
        {pageTab === 'history' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Company</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Salary</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Posted</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Pulled</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pulledJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                      No jobs pulled yet.{' '}
                      <Link href="/generate" className="text-blue-600 hover:underline">
                        Run a job search to get started
                      </Link>
                    </td>
                  </tr>
                )}
                {pulledJobs.map(job => (
                  <tr key={job.id} className={`hover:bg-slate-50 transition-colors group ${job.alreadyTailored ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-indigo-100 rounded-md flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">
                            {job.company.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900 whitespace-nowrap">{job.company}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-[200px]">
                      <div className="truncate">{job.title}</div>
                      {job.alreadyTailored && (
                        <span className="text-[10px] text-green-600 font-medium">Tailored</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[130px]">
                      <div className="truncate">{job.location}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {job.salary || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {job.posted_at
                        ? new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(job.pulled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            View ↗
                          </a>
                        )}
                        <Link
                          href={`/generate?url=${encodeURIComponent(job.url)}`}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Tailor Resume
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Inbox tab ───────────────────────────────────────────── */}
        {pageTab === 'inbox' && (
          <div className="space-y-4">
            {!inboxAccess ? (
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm px-8 py-16 flex flex-col items-center gap-5 text-center">
                <div className="text-5xl">📬</div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Golden Mailbox</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Upgrade to see all job-related emails matched to your applications automatically — interview invites, offers, and rejections in one place.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 space-y-1 text-sm">
                  <p className="font-semibold text-amber-800">Included in Unlimited · $49.99/mo</p>
                  <p className="text-amber-600 text-xs">Or add to any plan for $9/mo</p>
                </div>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
                  Unlock Golden Mailbox · $9/mo
                </button>
              </div>
            ) : !gmailConnected ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-8 py-16 flex flex-col items-center gap-5 text-center">
                <div className="text-5xl">📬</div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Connect your Gmail</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Resume OS will scan your inbox for job-related emails and match them to your applications automatically.
                  </p>
                </div>
                <a
                  href="/api/gmail/auth"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Connect Gmail
                </a>
              </div>
            ) : (
              <>
                {/* Inbox toolbar */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {labelFilter
                      ? `${emails.filter(e => e.label === labelFilter).length} of ${emails.length} email${emails.length !== 1 ? 's' : ''}`
                      : `${emails.length} email${emails.length !== 1 ? 's' : ''}`}
                  </p>
                  <div className="flex items-center gap-3">
                    {/* DELETE LATER — sample data button for testing */}
                    <button
                      onClick={async () => {
                        await fetch('/api/gmail/seed', { method: 'POST' });
                        fetchEmails();
                      }}
                      className="text-xs text-amber-500 hover:text-amber-700 border border-amber-200 hover:border-amber-400 px-2 py-1 rounded-md transition-colors"
                    >
                      + Sample emails
                    </button>
                    <button
                      onClick={async () => {
                        await fetch('/api/gmail/seed', { method: 'DELETE' });
                        fetchEmails();
                      }}
                      className="text-xs text-slate-300 hover:text-red-400 transition-colors"
                    >
                      Clear samples
                    </button>
                    <button
                      onClick={fetchEmails}
                      disabled={emailLoading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40"
                    >
                      {emailLoading ? 'Syncing...' : '↻ Sync'}
                    </button>
                    <button
                      onClick={disconnectGmail}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Label filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setLabelFilter(null)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      labelFilter === null
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {(Object.keys(LABEL_NAMES) as string[]).filter(k => k !== 'other').map(key => (
                    <button
                      key={key}
                      onClick={() => setLabelFilter(prev => prev === key ? null : key)}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        labelFilter === key
                          ? LABEL_STYLES[key]
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {LABEL_NAMES[key]}
                    </button>
                  ))}
                </div>

                {/* Email list + detail panel */}
                <div className="flex gap-4 h-[600px]">
                  {/* Email list */}
                  <div className="w-2/5 bg-white rounded-xl border border-slate-200 overflow-auto shadow-sm">
                    {emailLoading && emails.length === 0 && (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mr-2" />
                        Syncing emails...
                      </div>
                    )}
                    {!emailLoading && emails.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
                        <p>No job-related emails found.</p>
                        <button onClick={fetchEmails} className="text-blue-600 hover:underline text-xs">Sync inbox</button>
                      </div>
                    )}
                    {!emailLoading && emails.length > 0 && labelFilter && emails.filter(e => e.label === labelFilter).length === 0 && (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        No {LABEL_NAMES[labelFilter]?.toLowerCase()} emails.
                      </div>
                    )}
                    {emails.filter(e => !labelFilter || e.label === labelFilter).map(email => (
                      <button
                        key={email.gmail_id}
                        onClick={() => openEmailPanel(email)}
                        className={`w-full text-left px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          openEmail?.gmail_id === email.gmail_id ? 'bg-blue-50' : ''
                        } ${!email.is_read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {email.from_name ?? email.from_email}
                          </span>
                          {email.label && email.label !== 'other' && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${LABEL_STYLES[email.label] ?? ''}`}>
                              {LABEL_NAMES[email.label] ?? email.label}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mb-0.5 ${!email.is_read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{email.snippet}</p>
                        <p className="text-[10px] text-slate-300 mt-1">
                          {new Date(email.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Email detail */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-auto shadow-sm">
                    {!openEmail ? (
                      <div className="flex items-center justify-center h-full text-slate-300 text-sm">
                        Select an email to read
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <h3 className="text-base font-semibold text-slate-900">{openEmail.subject}</h3>
                            {openEmail.label && (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${LABEL_STYLES[openEmail.label] ?? ''}`}>
                                {LABEL_NAMES[openEmail.label] ?? openEmail.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            From: {openEmail.from_name ? `${openEmail.from_name} <${openEmail.from_email}>` : openEmail.from_email}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(openEmail.received_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          {openEmail.application_id && (
                            <Link
                              href={`/jobs`}
                              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Linked to application #{openEmail.application_id}
                            </Link>
                          )}
                        </div>
                        <div className="flex-1 overflow-auto px-6 py-4">
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {openEmail.body ?? openEmail.snippet ?? '(no body)'}
                          </pre>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
                          {replySent ? (
                            <p className="text-sm text-green-600 font-medium">Reply sent!</p>
                          ) : !replyOpen ? (
                            <button
                              onClick={() => setReplyOpen(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              ↩ Reply
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-500">To: {openEmail.from_email}</p>
                              <textarea
                                value={replyBody}
                                onChange={e => setReplyBody(e.target.value)}
                                placeholder="Write your reply..."
                                rows={5}
                                autoFocus
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={sendReply}
                                  disabled={replySending || !replyBody.trim()}
                                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                                >
                                  {replySending ? 'Sending…' : 'Send'}
                                </button>
                                <button
                                  onClick={() => { setReplyOpen(false); setReplyBody(''); }}
                                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tailored tab ─────────────────────────────────────────── */}
        {pageTab === 'tailored' && <>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total,        color: 'text-slate-900' },
            { label: 'Applied',     value: counts.applied,      color: 'text-blue-600'  },
            { label: 'Interviewing',value: counts.interviewing,  color: 'text-amber-600' },
            { label: 'Offers',      value: counts.offers,        color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Job Title</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">URL</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Resume</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Cover Letter</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No applications yet.{' '}
                    <Link href="/generate" className="text-blue-600 hover:underline">
                      Generate your first resume
                    </Link>
                  </td>
                </tr>
              )}
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                  {/* Company */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600">
                          {(app.company ?? '?').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900 whitespace-nowrap">{app.company ?? '—'}</span>
                    </div>
                  </td>

                  {/* Job Title */}
                  <td className="px-5 py-3.5 text-slate-700 max-w-[180px]">
                    <div className="truncate">{app.job_title ?? '—'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </td>

                  {/* URL */}
                  <td className="px-5 py-3.5 max-w-[160px]">
                    {app.url ? (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline truncate block max-w-[150px]"
                      >
                        {app.url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <select
                      value={app.status}
                      disabled={statusSaving === app.id}
                      onChange={e => changeStatus(app.id, e.target.value as ApplicationStatus)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_STYLES[app.status]}`}
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>

                  {/* Resume */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setPreview({ app, tab: 'resume' })}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Preview
                    </button>
                    <span className="text-slate-300 mx-1.5">·</span>
                    <a
                      href={`/api/pdf?id=${app.id}`}
                      target="_blank"
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium hover:underline"
                    >
                      PDF ↓
                    </a>
                  </td>

                  {/* Cover Letter */}
                  <td className="px-5 py-3.5">
                    {app.cover_letter ? (
                      <button
                        onClick={() => setPreview({ app, tab: 'cover' })}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        onClick={() => setPreview({ app, tab: 'cover' })}
                        className="text-xs text-slate-400 hover:text-blue-600 font-medium transition-colors"
                      >
                        + Generate
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setQaApp(app)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 hover:border-purple-400 px-2.5 py-1 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Answer job application questions"
                      >
                        Q&A
                      </button>
                      <Link
                        href={`/preview/${app.id}`}
                        className="text-xs text-slate-400 hover:text-slate-700 font-medium opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Full view
                      </Link>
                      <button
                        onClick={() => deleteApp(app.id)}
                        disabled={deleting === app.id}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Delete application"
                      >
                        {deleting === app.id ? '...' : '✕'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </> /* end tailored tab */}
      </div>
    </>
  );
}

export default function JobsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <JobsPage />
    </Suspense>
  );
}

