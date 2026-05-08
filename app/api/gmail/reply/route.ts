import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthClient } from '@/lib/gmail';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();
  if (!to || !body) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { gmailTokenQueries } = createDb(userId);

  const token = await gmailTokenQueries.get();
  if (!token) {
    if (process.env.OWNER_MODE === 'true') return NextResponse.json({ ok: true, mock: true });
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 });
  }

  const client = getOAuthClient();
  client.setCredentials({
    access_token:  token.access_token,
    refresh_token: token.refresh_token,
    expiry_date:   token.expiry ? new Date(token.expiry).getTime() : undefined,
  });

  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  const raw = [`To: ${to}`, `Subject: ${replySubject}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', body].join('\r\n');

  const gmail = google.gmail({ version: 'v1', auth: client });
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: Buffer.from(raw).toString('base64url') } });

  return NextResponse.json({ ok: true });
}
