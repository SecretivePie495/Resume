import { NextResponse } from 'next/server';
import { gmailTokenQueries, jobEmailQueries } from '@/lib/db';

export async function GET() {
  const [token, unread] = await Promise.all([gmailTokenQueries.get(), jobEmailQueries.unread()]);
  const connected = !!token || process.env.OWNER_MODE === 'true';
  if (!connected) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true, unread });
}
