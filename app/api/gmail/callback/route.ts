import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/gmail';
import { gmailTokenQueries } from '@/lib/db';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/jobs?gmail=error', req.url));

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/jobs?gmail=no_refresh_token', req.url));
    }

    await gmailTokenQueries.upsert(
      tokens.access_token ?? '',
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
    );

    return NextResponse.redirect(new URL('/jobs?gmail=connected&tab=inbox', req.url));
  } catch (err) {
    console.error('Gmail OAuth error:', err);
    return NextResponse.redirect(new URL('/jobs?gmail=error', req.url));
  }
}
