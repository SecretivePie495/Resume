'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResumePicker from '@/components/ResumePicker';

export default function QuickGeneratePage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ready = jd.trim().length > 0 && !loading && !parsing;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setParsing(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/resume/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to read file');
      setResume(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read file');
      setFileName('');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

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
          userResume: resume.trim() || undefined,
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
      <p className="text-sm text-slate-500 mb-6">Paste a job description and get a tailored resume.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Base Resume</label>
          <p className="text-xs text-slate-400 mb-2">
            Optional — pick a saved resume, upload a new one, or paste text below. Leave empty to use the default resume on file.
          </p>

          <ResumePicker
            currentResume={resume}
            currentFileName={fileName}
            onSelect={(content, name) => { setResume(content); setFileName(name); }}
          />

          <div className="mt-2 flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="hidden" id="resume-upload" />
            <label
              htmlFor="resume-upload"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
            >
              {parsing ? 'Reading file...' : '↑ Upload resume (PDF/DOCX)'}
            </label>
            {fileName && !parsing && <span className="text-xs text-slate-400 truncate">{fileName}</span>}
            {resume && (
              <button
                onClick={() => { setResume(''); setFileName(''); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-auto"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            value={resume}
            onChange={e => { setResume(e.target.value); if (fileName) setFileName(''); }}
            placeholder="…or paste resume text directly here"
            rows={6}
            className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-300"
          />
        </div>

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
