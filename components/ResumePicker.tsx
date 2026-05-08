'use client';

import { useState, useEffect, useRef } from 'react';

interface SavedResume {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

interface ResumePickerProps {
  currentResume: string;
  currentFileName: string;
  onSelect: (content: string, name: string) => void;
  onSaved?: (resume: SavedResume) => void;
}

export default function ResumePicker({ currentResume, currentFileName, onSelect, onSaved }: ResumePickerProps) {
  const [saved, setSaved]         = useState<SavedResume[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saveName, setSaveName]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [showSave, setShowSave]   = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/resumes')
      .then(r => r.json())
      .then(d => setSaved(d.resumes ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentResume && !showSave) {
      const suggested = currentFileName
        ? currentFileName.replace(/\.(pdf|docx?)$/i, '')
        : `Resume ${new Date().toLocaleDateString()}`;
      setSaveName(suggested);
    }
  }, [currentResume, currentFileName, showSave]);

  async function handleSave() {
    if (!saveName.trim() || !currentResume.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), content: currentResume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(prev => [data.resume, ...prev]);
      setShowSave(false);
      onSaved?.(data.resume);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
    setSaved(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  if (loading) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Saved resumes list */}
      {saved.length > 0 && (
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saved Resumes</p>
          <div className="space-y-1.5">
            {saved.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group cursor-pointer"
                onClick={() => onSelect(r.content, r.name)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-blue-600">CV</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use this →</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                    disabled={deleting === r.id}
                    className="text-slate-300 hover:text-red-500 transition-colors text-xs px-1"
                  >
                    {deleting === r.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save current resume */}
      {currentResume.trim() && (
        <div className={`px-4 py-3 border-t border-slate-100 ${saved.length === 0 ? 'border-t-0' : ''}`}>
          {!showSave ? (
            <button
              onClick={() => { setShowSave(true); setTimeout(() => nameRef.current?.focus(), 50); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              + Save current resume
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={nameRef}
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSave(false); }}
                placeholder="Resume name..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowSave(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
          )}
        </div>
      )}

      {saved.length === 0 && !currentResume.trim() && (
        <div className="px-4 py-5 text-center text-sm text-slate-400">
          No saved resumes yet — upload one below to save it for reuse
        </div>
      )}
    </div>
  );
}
