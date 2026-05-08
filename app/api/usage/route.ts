import { NextRequest, NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { PLAN_ORDER, type PlanId } from '@/lib/plans';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { getUsage, hasInboxAccess } = createDb(user.id, user.email);
  const [usage, inboxAccess] = await Promise.all([getUsage(), hasInboxAccess()]);
  return NextResponse.json({ ...usage, inboxAccess });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await req.json();
  if (!plan || !PLAN_ORDER.includes(plan as PlanId)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const { updatePlan } = createDb(user.id);
  await updatePlan(plan as PlanId);
  return NextResponse.json({ ok: true, plan });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { addExtraResumes } = createDb(user.id);

  const { resumes } = await req.json();
  if (!resumes || typeof resumes !== 'number' || resumes <= 0) {
    return NextResponse.json({ error: 'Invalid resumes count' }, { status: 400 });
  }
  await addExtraResumes(resumes);
  return NextResponse.json({ ok: true, added: resumes });
}
