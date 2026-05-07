'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Application, ApplicationStatus } from '@/lib/db';

const STATUSES: ApplicationStatus[] = ['generated', 'not_applied', 'applied', 'interviewing', 'offer', 'rejected'];

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLoading, setCoverLoading] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover'>('resume');

  useEffect(() => {
    fetch(`/api/applications?id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then((app: Application | null) => {
        if (app) {
          setApp(app);
          setNotes(app.notes ?? '');
        }
        setLoading(false);
      });
  }, [id]);

  async function handleStatusChange(status: ApplicationStatus) {
    if (!app) return;
    setStatusSaving(true);
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, status, notes }),
    });
    setApp({ ...app, status, notes });
    setStatusSaving(false);
  }

  async function handleNotesBlur() {
    if (!app) return;
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, status: app.status, notes }),
    });
  }

  async function generateCoverLetter() {
    if (!app) return;
    setCoverLoading(true);
    const res = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id }),
    });
    const data = await res.json();
    setApp({ ...app, cover_letter: data.cover_letter });
    setActiveTab('cover');
    setCoverLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 space-y-2">
        <p>Application not found.</p>
        <Link href="/" className="text-blue-400 text-sm hover:underline">← Back to dashboard</Link>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300 text-sm">{app.company} — {app.job_title}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex gap-2 border-b border-zinc-800 pb-0">
            {(['resume', 'cover'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-white border-blue-500'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
              >
                {tab === 'cover' ? 'Cover Letter' : 'Resume'}
              </button>
            ))}
          </div>

          {activeTab === 'resume' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Resume Preview</span>
                <a
                  href={`/api/pdf?id=${app.id}`}
                  target="_blank"
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors"
                >
                  Download PDF
                </a>
              </div>
              {app.resume_html ? (
                <iframe
                  srcDoc={app.resume_html}
                  className="w-full h-[880px] bg-white"
                  title="Resume"
                />
              ) : (
                <div className="p-8 text-zinc-500 text-sm">No resume HTML available.</div>
              )}
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Cover Letter</span>
                {app.cover_letter && (
                  <button
                    onClick={() => copyToClipboard(app.cover_letter!)}
                    className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-md transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              {app.cover_letter ? (
                <div className="p-6 text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                  {app.cover_letter}
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center gap-4 text-zinc-400">
                  <p className="text-sm">No cover letter yet.</p>
                  <button
                    onClick={generateCoverLetter}
                    disabled={coverLoading}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {coverLoading ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Application Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusSaving}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                    app.status === s
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes about this application..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 resize-none"
              />
            </div>
          </div>

          {!app.cover_letter && (
            <button
              onClick={generateCoverLetter}
              disabled={coverLoading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {coverLoading ? 'Generating cover letter...' : '+ Generate Cover Letter'}
            </button>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Details</h3>
            <div className="text-xs text-zinc-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Company</span>
                <span className="text-zinc-200">{app.company}</span>
              </div>
              <div className="flex justify-between">
                <span>Role</span>
                <span className="text-zinc-200">{app.job_title}</span>
              </div>
              <div className="flex justify-between">
                <span>Generated</span>
                <span className="text-zinc-200">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              {app.applied_at && (
                <div className="flex justify-between">
                  <span>Applied</span>
                  <span className="text-zinc-200">{new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
              )}
              {app.url && (
                <div className="pt-1">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View job posting ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
