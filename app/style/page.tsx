'use client';

import { useEffect, useState } from 'react';
import { BASE, DEFAULT_STYLE, FONT_OPTIONS, ResumeStyle, TailoredJob, buildHTML } from '@/lib/resume';

const SAMPLE_JOB: TailoredJob = {
  name: BASE.name,
  location: BASE.location,
  phone: BASE.phone,
  email: BASE.email,
  linkedinUrl: BASE.linkedinUrl,
  subtitle: 'AI Engineer | Full Stack Software Engineer',
  summary: 'AI-focused full stack engineer with proven expertise architecting and deploying enterprise AI automation platforms serving Fortune 500 clients. Specialized in building production-grade agentic workflows using OpenAI and Claude, designing scalable backend microservices with REST APIs, and implementing secure cloud infrastructure on Microsoft Azure.',
  utg_title: BASE.utg.title,
  utg_bullets: BASE.utg.bullets.slice(0, 5),
};

const SLIDERS: { key: keyof ResumeStyle; label: string; min: number; max: number; step: number }[] = [
  { key: 'nameSize',     label: 'Name',           min: 14, max: 32, step: 0.5 },
  { key: 'subtitleSize', label: 'Subtitle',       min: 8,  max: 18, step: 0.5 },
  { key: 'sectionSize',  label: 'Section Headers', min: 8,  max: 18, step: 0.5 },
  { key: 'bodySize',     label: 'Body Text',       min: 7,  max: 14, step: 0.5 },
];

export default function StylePage() {
  const [style, setStyle]     = useState<ResumeStyle>(DEFAULT_STYLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/style')
      .then(r => r.json())
      .then(d => { if (d.style) setStyle(d.style); })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof ResumeStyle>(key: K, value: ResumeStyle[K]) {
    setStyle(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/style', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(style),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setStyle(data.style);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setStyle(DEFAULT_STYLE);
    setSaved(false);
  }

  const previewHtml = buildHTML(SAMPLE_JOB, style);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Resume Style</h1>
      <p className="text-sm text-slate-500 mb-6">Tweak fonts, sizes, and colors. Changes preview live and apply to every resume you generate after saving.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-semibold text-slate-500">Font</label>
            <select
              value={style.fontFamily}
              onChange={e => update('fontFamily', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(FONT_OPTIONS).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <label className="block text-xs font-semibold text-slate-500">Font Sizes</label>
            {SLIDERS.map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs text-slate-400 tabular-nums">{style[key]}pt</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={style[key] as number}
                  onChange={e => update(key, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-semibold text-slate-500">Colors</label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Accent (name, headers)</span>
              <input
                type="color"
                value={style.accentColor}
                onChange={e => update('accentColor', e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Secondary (subtitle, dates)</span>
              <input
                type="color"
                value={style.secondaryColor}
                onChange={e => update('secondaryColor', e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save as Default'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 text-sm font-medium text-slate-500 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Live Preview</span>
          </div>
          <div className="bg-white" style={{ height: '80vh' }}>
            <iframe title="Resume preview" srcDoc={previewHtml} className="w-full h-full border-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
