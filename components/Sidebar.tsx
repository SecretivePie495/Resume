'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UsageWidget from './UsageWidget';

const NAV = [
  { href: '/generate', label: 'Resume Builder' },
  { href: '/jobs',     label: 'AI Tailor' },
  { href: '/templates', label: 'Templates' },
];

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
        <UsageWidget />
        <Link
          href="/generate"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          + New Application
        </Link>
      </div>
    </aside>
  );
}
