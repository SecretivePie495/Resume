import { google } from 'googleapis';

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  });
}

// Extract plain-text body from Gmail message parts
export function extractBody(payload: Record<string, unknown>): string {
  function decode(data: string): string {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  }

  function walk(part: Record<string, unknown>): string {
    const mimeType = part.mimeType as string;
    const body = part.body as Record<string, unknown>;
    const parts = part.parts as Record<string, unknown>[] | undefined;

    if (mimeType === 'text/plain' && body?.data) return decode(body.data as string);
    if (parts) {
      for (const p of parts) {
        const result = walk(p);
        if (result) return result;
      }
    }
    return '';
  }

  return walk(payload).trim();
}

// Classify email label using simple keyword matching (no Claude cost)
export function classifyEmail(subject: string, snippet: string): string {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/interview|schedule|call|zoom|meet|calendly|availability/i.test(text)) return 'interview';
  if (/offer|congratulations|pleased to|position.*offer|salary.*offer/i.test(text)) return 'offer';
  if (/unfortunately|not moving forward|other candidates|not.*selected|regret/i.test(text)) return 'rejection';
  if (/received your application|thank you for applying|we.*received/i.test(text)) return 'confirmation';
  if (/follow.?up|checking in|update on/i.test(text)) return 'follow_up';
  return 'other';
}

// Try to match email sender domain to an application company
export function matchApplication(
  fromEmail: string,
  subject: string,
  apps: { id: number; company: string | null }[],
): number | null {
  const domain = fromEmail.split('@')[1]?.toLowerCase() ?? '';
  const subjectLow = subject.toLowerCase();

  for (const app of apps) {
    if (!app.company) continue;
    const co = app.company.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Domain match: stripe.com → stripe
    const domainBase = domain.split('.')[0];
    if (domainBase && co.includes(domainBase)) return app.id;
    if (domainBase && domainBase.includes(co.slice(0, 5))) return app.id;

    // Subject match
    if (subjectLow.includes(app.company.toLowerCase())) return app.id;
  }
  return null;
}
