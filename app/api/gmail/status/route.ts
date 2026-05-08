import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ connected: false });
  const { gmailTokenQueries, jobEmailQueries } = createDb(userId);

  const [token, unread] = await Promise.all([gmailTokenQueries.get(), jobEmailQueries.unread()]);
  const connected = !!token || process.env.OWNER_MODE === 'true';
  if (!connected) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true, unread });
}
