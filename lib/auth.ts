import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
};

export async function getAuthUserId(): Promise<string | null> {
  if (process.env.OWNER_MODE === 'true') return 'owner';
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}
