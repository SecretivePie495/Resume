'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import UsageWidget from './UsageWidget';

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
