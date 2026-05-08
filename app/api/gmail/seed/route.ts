import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

const SAMPLES = [
  { gmail_id: 'seed-001', from_email: 'recruiting@stripe.com', from_name: 'Stripe Recruiting', subject: 'Interview Invitation — Software Engineer', snippet: 'Hi Udo, we reviewed your application and would love to schedule a technical interview.', body: `Hi Udo,\n\nThank you for applying to the Software Engineer role at Stripe. We were impressed with your background and would love to move forward with a technical interview.\n\nPlease use the link below to schedule a 45-minute technical screen:\nhttps://calendly.com/stripe-recruiting/technical-screen\n\nBest,\nSarah Chen\nStripe Recruiting`, received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), label: 'interview' },
  { gmail_id: 'seed-002', from_email: 'hr@anthropic.com', from_name: 'Anthropic HR', subject: 'Offer Letter — AI Automation Engineer', snippet: 'Congratulations! We are thrilled to extend an offer for the AI Automation Engineer position.', body: `Dear Udo,\n\nCongratulations! We are thrilled to extend an offer for the AI Automation Engineer position at Anthropic.\n\nOffer Details:\n- Base Salary: $185,000\n- Start Date: June 1, 2026\n\nBest,\nAnthropic HR`, received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), label: 'offer' },
  { gmail_id: 'seed-003', from_email: 'talent@openai.com', from_name: 'OpenAI Talent', subject: 'Your application to OpenAI', snippet: 'After careful consideration, we have decided to move forward with other candidates.', body: `Hi Udo,\n\nThank you for interviewing with us for the AI Engineer role at OpenAI.\n\nAfter careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.\n\nWarm regards,\nOpenAI Talent Team`, received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), label: 'rejection' },
  { gmail_id: 'seed-004', from_email: 'noreply@vercel.com', from_name: 'Vercel Talent Team', subject: 'We received your application — Senior AI Engineer', snippet: 'Thank you for your interest. Our team is reviewing your application.', body: `Hi Udo,\n\nThank you for applying to the Senior AI Engineer position at Vercel.\n\nWe will be in touch within 5–7 business days.\n\nBest regards,\nVercel Talent Team`, received_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), label: 'confirmation' },
  { gmail_id: 'seed-005', from_email: 'recruiting@linear.app', from_name: 'Linear Recruiting', subject: 'Following up on your application', snippet: 'Hi Udo, just checking in to see if you are still interested in the role.', body: `Hi Udo,\n\nI wanted to follow up on your application for the Automation Engineer role at Linear.\n\nAre you available for a quick 20-minute call this week?\n\nBest,\nJamie\nLinear Recruiting`, received_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), label: 'follow_up' },
];

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { jobEmailQueries } = createDb(userId);

  let inserted = 0;
  for (const s of SAMPLES) {
    try {
      await jobEmailQueries.upsert(s.gmail_id, s.from_email, s.from_name, s.subject, s.snippet, s.body, s.received_at, null, s.label);
      inserted++;
    } catch { /* already exists */ }
  }
  return NextResponse.json({ ok: true, inserted });
}

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { jobEmailQueries } = createDb(userId);
  await jobEmailQueries.deleteSamples();
  return NextResponse.json({ ok: true });
}
