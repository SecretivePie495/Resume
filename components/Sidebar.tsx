'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import UsageWidget from './UsageWidget';
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans';

const NAV = [
  { href: '/generate',  label: 'Resume Builder' },
  { href: '/jobs',      label: 'AI Tailor' },
  { href: '/templates', label: 'Templates' },
];

function GoldenMailbox() {
  const [inboxAccess, setInboxAccess] = useState<boolean | null>(null);
  const [unread, setUnread]           = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => setInboxAccess(d.inboxAccess ?? false));
    fetch('/api/gmail/status')
      .then(r => r.json())
      .then(d => { if (d.connected) setUnread(d.unread ?? 0); });
  }, []);

  if (inboxAccess === null) return null;

  if (inboxAccess) {
    return (
      <Link
        href="/jobs?tab=inbox"
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 hover:border-amber-400 transition-all group"
      >
        <span className="text-lg leading-none">📬</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-800">Golden Mailbox</p>
          <p className="text-[10px] text-amber-600">
            {unread > 0 ? `${unread} unread` : 'Job inbox'}
          </p>
        </div>
        {unread > 0 && (
          <span className="w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 hover:border-amber-400 transition-all opacity-80 hover:opacity-100"
      >
        <span className="text-lg leading-none">📫</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-amber-800">Golden Mailbox</p>
          <p className="text-[10px] text-amber-500">+$9/mo · Unlock</p>
        </div>
        <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V9a6 6 0 10-12 0v1" />
        </svg>
      </button>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgrade(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-bold text-slate-900">Golden Mailbox</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Connect your Gmail and get all job-related emails — interview invites, offers, rejections — automatically matched to your applications in one place.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs text-amber-700 font-medium">Included in Unlimited · $49.99/mo</p>
              <p className="text-xs text-amber-600">Or add to any plan for just $9/mo</p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                Add Golden Mailbox · $9/mo
              </button>
              <button className="text-slate-400 hover:text-slate-600 text-xs transition-colors" onClick={() => setShowUpgrade(false)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const PLAN_META: Record<PlanId, { highlight?: boolean }> = {
  free:      {},
  starter:   {},
  pro:       { highlight: true },
  unlimited: {},
};

function UpgradeModal({ currentPlan, onClose }: { currentPlan: PlanId; onClose: () => void }) {
  const tierIndex   = PLAN_ORDER.indexOf(currentPlan);
  const upgradeable = PLAN_ORDER.slice(tierIndex + 1) as PlanId[];
  const defaultPlan = upgradeable.includes('pro') ? 'pro' : upgradeable[0];
  const [selected, setSelected] = useState<PlanId>(defaultPlan);
  const [upgrading, setUpgrading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch('/api/usage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => window.location.reload(), 1200);
      }
    } finally {
      setUpgrading(false);
    }
  }

  const cols = upgradeable.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : upgradeable.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-slate-900">Upgrade your plan</h2>
          <p className="text-sm text-slate-500 mt-1">
            You're on <span className="font-medium text-slate-700">{PLANS[currentPlan].name}</span>. Choose a plan to unlock more.
          </p>
        </div>

        <div className={`grid ${cols} gap-3`}>
          {upgradeable.map((id) => {
            const plan = PLANS[id];
            const { highlight } = PLAN_META[id];
            const isSelected = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? highlight
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${
                  id === 'unlimited' ? 'bg-violet-100 text-violet-700' :
                  id === 'pro'       ? 'bg-blue-100 text-blue-700' :
                                       'bg-green-100 text-green-700'
                }`}>
                  {plan.name}
                </span>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 w-full">
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    {plan.resumes} resumes/mo
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    {plan.searches === -1 ? 'Unlimited' : plan.searches} job searches
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    {plan.covers} cover letters
                  </li>
                  {plan.inbox && (
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-500">✓</span>
                      Golden Mailbox
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>

        {done ? (
          <div className="mt-4 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Upgraded to {PLANS[selected].name}!
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            {upgrading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Upgrading...
              </span>
            ) : `Upgrade to ${PLANS[selected].name} — $${PLANS[selected].price}/mo`}
          </button>
        )}
        <p className="text-center text-[11px] text-slate-400 mt-2">Cancel anytime · No hidden fees</p>
      </div>
    </div>
  );
}

function UpgradeButton() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [showModal, setShowModal]     = useState(false);
  const [loaded, setLoaded]           = useState(false);

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setCurrentPlan((d?.plan as PlanId) ?? 'free');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (loaded && currentPlan === 'unlimited') return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Upgrade Plan
      </button>
      {showModal && <UpgradeModal currentPlan={currentPlan} onClose={() => setShowModal(false)} />}
    </>
  );
}

function UserFooter() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  const { name, email, image } = session.user;
  return (
    <div className="flex items-center gap-2.5 px-1 py-2">
      {image ? (
        <img src={image} alt={name ?? ''} className="w-7 h-7 rounded-full shrink-0" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-slate-600">{(name ?? email ?? '?')[0].toUpperCase()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{name ?? email}</p>
        {name && <p className="text-[10px] text-slate-400 truncate">{email}</p>}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/signin' })}
        title="Sign out"
        className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  function active(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="text-slate-900 font-semibold tracking-tight text-sm">Resume·OS</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                active(href)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active(href) ? 'bg-blue-600' : 'bg-slate-300'}`} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-2 py-4 border-t border-slate-200 space-y-3">
        <UpgradeButton />
        <GoldenMailbox />
        <UsageWidget />
        <Link
          href="/generate"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          + New Application
        </Link>
        <div className="border-t border-slate-100 pt-2">
          <UserFooter />
        </div>
      </div>
    </aside>
  );
}
