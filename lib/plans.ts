export type PlanId = 'free' | 'starter' | 'pro' | 'unlimited';

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'unlimited'];

export interface PlanDef {
  name: string;
  price: number;
  resumes: number;
  searches: number;  // -1 = unlimited
  covers: number;
  inbox: boolean;    // Golden Mailbox access
}

export const PLANS: Record<PlanId, PlanDef> = {
  free:      { name: 'Free',      price: 0,     resumes: 5,   searches: 3,  covers: 2,   inbox: false },
  starter:   { name: 'Starter',   price: 9,     resumes: 30,  searches: 15, covers: 15,  inbox: false },
  pro:       { name: 'Pro',       price: 19,    resumes: 100, searches: 50, covers: 50,  inbox: false },
  unlimited: { name: 'Unlimited', price: 49.99, resumes: 500, searches: -1, covers: 250, inbox: true  },
};

export const INBOX_ADDON_PRICE = 9; // $/month for Golden Mailbox on non-Unlimited plans

export const EXTRA_PACKS = [
  { resumes: 10,  price: 0.99  },
  { resumes: 50,  price: 3.99  },
  { resumes: 100, price: 6.99  },
  { resumes: 500, price: 24.99 },
] as const;
