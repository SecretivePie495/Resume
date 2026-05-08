'use client';

import { useState, useEffect, useCallback } from 'react';
import { EXTRA_PACKS, PLANS, type PlanId } from '@/lib/plans';

interface Usage {
  plan: PlanId;
  resumes_used: number;
  searches_used: number;
  covers_used: number;
  extra_resumes: number;
  reset_at: string;
}

function Bar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total === -1 ? 0 : Math.min(100, Math.round((used / total) * 100));
  const isNearLimit = pct >= 80;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-400 tabular-nums w-16 text-right shrink-0">
        {total === -1 ? `${used} / ∞` : `${used} / ${total}`}
      </span>
    </div>
  );
}

export default function UsageWidget() {
  const [usage, setUsage]       = useState<Usage | null>(null);
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState(0);
  const [adding, setAdding]     = useState(false);
  const [added, setAdded]       = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/usage');
    if (res.ok) setUsage(await res.json());
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('resumeos:usage-updated', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('resumeos:usage-updated', onFocus);
    };
  }, [load]);

  async function handleAdd() {
    const pack = EXTRA_PACKS[selected];
    setAdding(true);
    try {
      // TODO: replace with Stripe checkout before launch
      const res = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumes: pack.resumes }),
      });
      if (res.ok) {
        setAdded(pack.resumes);
        await load();
        setTimeout(() => { setAdded(null); setOpen(false); }, 2000);
      }
    } finally {
      setAdding(false);
    }
  }

  if (!usage) return null;

  const plan    = PLANS[usage.plan];
  const ceiling = plan.resumes + usage.extra_resumes;
  const resumesPct = Math.min(100, Math.round((usage.resumes_used / ceiling) * 100));
  const nearLimit  = resumesPct >= 80;
  const resetDate  = new Date(usage.reset_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            usage.plan === 'unlimited' ? 'bg-violet-100 text-violet-700' :
            usage.plan === 'pro'       ? 'bg-blue-100 text-blue-700' :
            usage.plan === 'starter'   ? 'bg-green-100 text-green-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {plan.name}
          </span>
          {nearLimit && (
            <span className="text-[11px] text-amber-600 font-medium">Running low</span>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {open ? 'Close' : '+ Add More'}
        </button>
      </div>

      {/* Usage bars */}
      <div className="px-4 py-3 space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Resumes</span>
          </div>
          <Bar used={usage.resumes_used} total={ceiling} color="bg-blue-500" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Job Searches</span>
          </div>
          <Bar used={usage.searches_used} total={plan.searches} color="bg-emerald-500" />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Cover Letters</span>
          </div>
          <Bar used={usage.covers_used} total={plan.covers} color="bg-purple-500" />
        </div>

        <p className="text-[10px] text-slate-300 pt-1">Resets {resetDate}</p>
      </div>

      {/* Add More Panel */}
      {open && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-3">
          <p className="text-xs font-semibold text-slate-700">Add Resume Credits</p>
          <p className="text-[11px] text-slate-400">Credits roll over month to month.</p>

          <div className="grid grid-cols-2 gap-2">
            {EXTRA_PACKS.map((pack, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                  selected === i
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-bold text-slate-900">{pack.resumes}</span>
                <span className="text-[11px] text-slate-500">resumes</span>
                <span className={`text-xs font-semibold mt-1 ${selected === i ? 'text-blue-600' : 'text-slate-700'}`}>
                  ${pack.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>

          {added !== null ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-700 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {added} resumes added!
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : `Add ${EXTRA_PACKS[selected].resumes} Resumes — $${EXTRA_PACKS[selected].price.toFixed(2)}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
