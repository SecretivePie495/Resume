'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickGeneratePage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ready = jd.trim().length > 0 && !loading;

  async function handleGenerate() {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          jd: jd.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate resume');
        return;
      }
      router.push(`/preview/${data.id}`);
    } catch {
      setError('Failed to generate resume');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Quick Tailor</h1>
      <p className="text-sm text-slate-500 mb-6">Paste a job description and get a tailored resume — uses your base resume automatically.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company</label>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title</label>
          <input
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="AI Automation Engineer"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Description</label>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={12}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={!ready}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : 'Generate Resume'}
        </button>
      </div>
    </div>
  );
}
