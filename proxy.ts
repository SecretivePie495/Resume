import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(req: NextRequest) {
  if (process.env.OWNER_MODE === 'true') return NextResponse.next();
  return (withAuth({ pages: { signIn: '/signin' } }) as (req: NextRequest) => Response)(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|signin).*)'],
};
