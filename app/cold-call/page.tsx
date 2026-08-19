'use client';

import { useState, useEffect, useCallback } from 'react';
import { Prospect, ProspectStatus } from '@/lib/db';

const STATUS_STYLES: Record<ProspectStatus, string> = {
  not_called:     'bg-slate-100 text-slate-600',
  called:         'bg-blue-100 text-blue-700',
  interested:     'bg-green-100 text-green-700',
  not_interested: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<ProspectStatus, string> = {
  not_called:     'Not Called',
  called:         'Called',
  interested:     'Interested',
  not_interested: 'Not Interested',
};

const ALL_STATUSES: ProspectStatus[] = ['not_called', 'called', 'interested', 'not_interested'];

const SCORE_STYLES: Record<string, string> = {
  hot:  'bg-orange-100 text-orange-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-slate-100 text-slate-500',
};

function ScoreBadge({ score }: { score: string | null }) {
  if (!score) return null;
  const key = score.toLowerCase();
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${SCORE_STYLES[key] ?? 'bg-slate-100 text-slate-500'}`}>
      {score}
    </span>
  );
}

function ScriptPanel({ prospect, onClose, onScriptGenerated }: {
  prospect: Prospect;
  onClose: () => void;
  onScriptGenerated: (id: number, script: string) => void;
}) {
  const [script, setScript]   = useState(prospect.call_script ?? '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/prospects/call-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id }),
      });
      const data = await res.json();
      if (data.call_script) {
        setScript(data.call_script);
        onScriptGenerated(prospect.id, data.call_script);
      }
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{prospect.business}</h2>
            <p className="text-sm text-slate-500">{prospect.category ?? '—'} {prospect.phone ? `· ${prospect.phone}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!script ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <p className="text-sm text-slate-500">No script yet for this prospect.</p>
              <button
                onClick={generate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Generating…' : 'Generate Script'}
              </button>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">{script}</pre>
          )}
        </div>

        {script && (
          <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex gap-2">
            <button
              onClick={copy}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="text-sm font-semibold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ColdCallPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading]     = useState(true);
  const [pasteText, setPasteText] = useState('');
  const [importing, setImporting] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [active, setActive]       = useState<Prospect | null>(null);

  const load = useCallback(() => {
    fetch('/api/prospects')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProspects(d.prospects); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleImport() {
    if (!pasteText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
        setPasteText('');
        setShowPaste(false);
      }
    } finally {
      setImporting(false);
    }
  }

  async function updateStatus(id: number, status: ProspectStatus) {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function removeProspect(id: number) {
    setProspects(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
  }

  function onScriptGenerated(id: number, script: string) {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, call_script: script } : p));
    setActive(prev => prev && prev.id === id ? { ...prev, call_script: script } : prev);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cold Call</h1>
          <p className="text-sm text-slate-500 mt-0.5">Prospect list and call scripts for UTG Labs outreach.</p>
        </div>
        <button
          onClick={() => setShowPaste(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + Import List
        </button>
      </div>

      {showPaste && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste a prospect list here — a markdown table, a plain list, anything with business names, phone numbers, categories, notes..."
            className="w-full h-40 text-sm border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowPaste(false)}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !pasteText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : prospects.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No prospects yet. Paste a list to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {prospects.map(p => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.business}</p>
                  <ScoreBadge score={p.score} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {p.category ?? '—'}
                  {p.phone && (
                    <> · <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline">{p.phone}</a></>
                  )}
                </p>
                {p.notes && <p className="text-xs text-slate-400 mt-1 truncate">{p.notes}</p>}
              </div>

              <select
                value={p.status}
                onChange={e => updateStatus(p.id, e.target.value as ProspectStatus)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_STYLES[p.status]}`}
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>

              <button
                onClick={() => setActive(p)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                {p.call_script ? 'View Script' : 'Get Script'}
              </button>

              <button
                onClick={() => removeProspect(p.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <ScriptPanel
          prospect={active}
          onClose={() => setActive(null)}
          onScriptGenerated={onScriptGenerated}
        />
      )}
    </div>
  );
}
