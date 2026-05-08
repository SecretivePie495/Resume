import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Resume OS',
  description: 'AI-powered resume builder and application tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-auto min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
