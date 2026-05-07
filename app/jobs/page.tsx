'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Application, ApplicationStatus } from '@/lib/db';

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

export default function JobsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [statusSaving, setStatusSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(setApps);
  }, []);

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
            {apps.length > 0 && (
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
      </div>
    </>
  );
}
