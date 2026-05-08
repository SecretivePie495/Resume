import { NextResponse } from 'next/server';
import { jobEmailQueries } from '@/lib/db';

const SAMPLES = [
  {
    gmail_id: 'seed-001',
    from_email: 'recruiting@stripe.com',
    from_name: 'Stripe Recruiting',
    subject: 'Interview Invitation — Software Engineer',
    snippet: 'Hi Udo, we reviewed your application and would love to schedule a technical interview with our engineering team.',
    body: `Hi Udo,

Thank you for applying to the Software Engineer role at Stripe. We were impressed with your background and would love to move forward with a technical interview.

Please use the link below to schedule a 45-minute technical screen:

https://calendly.com/stripe-recruiting/technical-screen

We look forward to speaking with you!

Best,
Sarah Chen
Stripe Recruiting`,
    received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    label: 'interview',
  },
  {
    gmail_id: 'seed-002',
    from_email: 'hr@anthropic.com',
    from_name: 'Anthropic HR',
    subject: 'Offer Letter — AI Automation Engineer',
    snippet: 'Congratulations Udo! We are thrilled to extend an offer for the AI Automation Engineer position at Anthropic.',
    body: `Dear Udo,

Congratulations! We are thrilled to extend an offer for the AI Automation Engineer position at Anthropic.

Offer Details:
- Role: AI Automation Engineer
- Start Date: June 1, 2026
- Compensation: $185,000 base salary
- Equity: 0.05% options vesting over 4 years
- Benefits: Full health, dental, vision + 401k match

Please review the attached offer letter and sign by May 15, 2026.

We are excited to have you join the team!

Best,
Anthropic HR`,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    label: 'offer',
  },
  {
    gmail_id: 'seed-003',
    from_email: 'talent@openai.com',
    from_name: 'OpenAI Talent',
    subject: 'Your application to OpenAI',
    snippet: 'After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.',
    body: `Hi Udo,

Thank you for taking the time to interview with us for the AI Engineer role at OpenAI.

After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.

We were impressed with your background and encourage you to apply for future openings.

Wishing you the best in your search.

Warm regards,
OpenAI Talent Team`,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    label: 'rejection',
  },
  {
    gmail_id: 'seed-004',
    from_email: 'noreply@vercel.com',
    from_name: 'Vercel Talent Team',
    subject: 'We received your application — Senior AI Engineer',
    snippet: 'Thank you for your interest in the Senior AI Engineer position. Our team is reviewing your application.',
    body: `Hi Udo,

Thank you for applying to the Senior AI Engineer position at Vercel.

We have received your application and our team is currently reviewing it. We will be in touch within 5–7 business days with next steps.

Thank you for your interest in Vercel!

Best regards,
Vercel Talent Team`,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    label: 'confirmation',
  },
  {
    gmail_id: 'seed-005',
    from_email: 'recruiting@linear.app',
    from_name: 'Linear Recruiting',
    subject: 'Following up on your application',
    snippet: 'Hi Udo, just checking in to see if you are still interested in the role and available for a quick call this week.',
    body: `Hi Udo,

I wanted to follow up on your application for the Automation Engineer role at Linear.

Are you still interested and available for a quick 20-minute intro call this week? I have openings Thursday and Friday afternoon.

Let me know what works best for you.

Best,
Jamie
Linear Recruiting`,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    label: 'follow_up',
  },
];

export async function POST() {
  let inserted = 0;
  for (const s of SAMPLES) {
    try {
      await jobEmailQueries.upsert(
        s.gmail_id, s.from_email, s.from_name, s.subject,
        s.snippet, s.body, s.received_at, null, s.label,
      );
      inserted++;
    } catch { /* already exists */ }
  }
  return NextResponse.json({ ok: true, inserted });
}

export async function DELETE() {
  await jobEmailQueries.deleteSamples();
  return NextResponse.json({ ok: true });
}
