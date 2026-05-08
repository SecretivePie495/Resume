import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthClient, extractBody, classifyEmail, matchApplication } from '@/lib/gmail';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

function domainsFromApps(apps: { url: string | null; company: string | null }[]): string[] {
  const domains = new Set<string>();
  for (const app of apps) {
    if (app.url) {
      try {
        const host = new URL(app.url).hostname.replace(/^www\./, '');
        const ATS_HOSTS = ['greenhouse.io', 'lever.co', 'workday.com', 'taleo.net', 'icims.com', 'jobvite.com', 'smartrecruiters.com', 'breezy.hr', 'ashbyhq.com', 'rippling.com'];
        if (!ATS_HOSTS.includes(host)) {
          const parts = host.split('.');
          domains.add(parts.slice(-2).join('.'));
        }
      } catch { /* invalid URL */ }
    }
    if (app.company && domains.size === 0) {
      const slug = app.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (slug.length > 2) domains.add(`${slug}.com`);
    }
  }
  return [...domains];
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { gmailTokenQueries, jobEmailQueries, queries: appQueries, hasInboxAccess } = createDb(userId);

  if (!(await hasInboxAccess())) return NextResponse.json({ error: 'Golden Mailbox requires an upgrade' }, { status: 403 });
  const token = await gmailTokenQueries.get();

  if (!token) {
    if (process.env.OWNER_MODE === 'true') {
      return NextResponse.json({ emails: await jobEmailQueries.list(), domains: [] });
    }
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 });
  }

  try {
    const client = getOAuthClient();
    client.setCredentials({
      access_token:  token.access_token,
      refresh_token: token.refresh_token,
      expiry_date:   token.expiry ? new Date(token.expiry).getTime() : undefined,
    });

    client.on('tokens', (tokens) => {
      gmailTokenQueries.upsert(
        tokens.access_token ?? token.access_token ?? '',
        token.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : token.expiry ?? '',
      ).catch(console.error);
    });

    const gmail = google.gmail({ version: 'v1', auth: client });
    const apps  = await appQueries.list();
    const domains = domainsFromApps(apps);

    const query = domains.length > 0
      ? `(${domains.map(d => `from:${d}`).join(' OR ')}) newer_than:90d`
      : 'subject:(application OR interview OR offer OR position OR hiring) newer_than:90d';

    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 100 });
    const messages = listRes.data.messages ?? [];

    for (const msg of messages) {
      if (!msg.id) continue;
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
      const headers = detail.data.payload?.headers ?? [];
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(no subject)';
      const fromRaw = headers.find(h => h.name === 'From')?.value ?? '';
      const dateRaw = headers.find(h => h.name === 'Date')?.value ?? '';
      const snippet = detail.data.snippet ?? '';

      const fromMatch = fromRaw.match(/^(?:"?(.+?)"?\s+)?<?([^>]+)>?$/);
      const fromName  = fromMatch?.[1]?.trim() ?? null;
      const fromEmail = fromMatch?.[2]?.trim() ?? fromRaw;

      const receivedAt    = dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString();
      const body          = extractBody(detail.data.payload as Record<string, unknown>);
      const label         = classifyEmail(subject, snippet);
      const applicationId = matchApplication(fromEmail, subject, apps);

      try {
        await jobEmailQueries.upsert(msg.id, fromEmail, fromName, subject, snippet, body.slice(0, 5000), receivedAt, applicationId, label);
      } catch { /* skip duplicates */ }
    }

    return NextResponse.json({ emails: await jobEmailQueries.list(), domains });
  } catch (err) {
    console.error('Gmail fetch error:', err);
    if (process.env.OWNER_MODE === 'true') {
      return NextResponse.json({ emails: await jobEmailQueries.list(), domains: [] });
    }
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { jobEmailQueries } = createDb(userId);
  const { gmail_id } = await req.json();
  if (gmail_id) await jobEmailQueries.markRead(gmail_id);
  return NextResponse.json({ ok: true });
}
