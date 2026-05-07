'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  preview: string; // CSS accent color
  style: 'classic' | 'modern' | 'minimal' | 'bold' | 'creative' | 'executive';
}

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, timeless layout. Serif headings, generous whitespace. Works for any industry.',
    tags: ['All industries'],
    preview: '#1e3a5f',
    style: 'classic',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column layout with a sidebar for skills and contact info. Great for tech roles.',
    tags: ['Tech', 'Design', 'ATS-friendly'],
    preview: '#2563eb',
    style: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean single-column. No color, no frills — lets your content speak.',
    tags: ['Finance', 'Legal', 'ATS-friendly'],
    preview: '#374151',
    style: 'minimal',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong header block with a colored bar. Commands attention on the recruiter\'s desk.',
    tags: ['Marketing', 'Sales', 'Creative'],
    preview: '#7c3aed',
    style: 'bold',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Asymmetric grid with accent colors. Best for design, media, and creative portfolios.',
    tags: ['Design', 'Media', 'Creative'],
    preview: '#0891b2',
    style: 'creative',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Refined and polished. Dense but readable — built for senior and C-suite roles.',
    tags: ['Executive', 'Senior', 'ATS-friendly'],
    preview: '#1f2937',
    style: 'executive',
  },
];

function TemplateCard({ template, selected, onSelect }: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer bg-white border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      {/* Mock resume preview */}
      <div className="h-48 bg-slate-50 p-4 flex flex-col gap-2 overflow-hidden relative">
        {/* Color accent bar */}
        <div className="w-full h-1.5 rounded-full mb-1" style={{ backgroundColor: template.preview }} />
        {/* Fake name line */}
        <div className="h-3 rounded w-2/3" style={{ backgroundColor: template.preview, opacity: 0.9 }} />
        {/* Fake subtitle */}
        <div className="h-2 rounded w-1/2 bg-slate-300" />
        {/* Fake divider */}
        <div className="h-px bg-slate-200 my-1" />
        {/* Fake body lines */}
        {[80, 95, 70, 85, 60].map((w, i) => (
          <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
        ))}
        {/* Fake section header */}
        <div className="h-2 rounded w-1/3 mt-1" style={{ backgroundColor: template.preview, opacity: 0.5 }} />
        {[75, 90, 55].map((w, i) => (
          <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
        ))}

        {selected && (
          <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
          {selected && (
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {template.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [selected, setSelected] = useState('modern');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('resume_template', selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const activeTemplate = TEMPLATES.find(t => t.id === selected)!;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resume Templates</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a layout — Claude will use it when generating your tailored resumes</p>
        </div>
        <button
          onClick={handleSave}
          className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? '✓ Saved' : 'Save Template'}
        </button>
      </div>

      {/* Active template banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5">
        <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
        <p className="text-sm text-slate-700">
          Active template: <span className="font-semibold text-blue-700">{activeTemplate.name}</span>
          <span className="text-slate-500"> — {activeTemplate.description}</span>
        </p>
        <Link href="/generate" className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
          Use it now →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-5">
        {TEMPLATES.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selected === t.id}
            onSelect={() => setSelected(t.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center pb-4">
        Layout and styling change; your content stays the same.
      </p>
    </div>
  );
}
