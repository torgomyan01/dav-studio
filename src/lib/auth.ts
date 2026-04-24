import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

import { findUserByPhone } from '@/lib/find-user-by-phone';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        // NextAuth-ի client `signIn`-ը հաճախ ճիշտ չի փոխանցում հատուկ անուններով դաշտերը — օգտագործում ենք `email` բանալին (արժեքը հեռախոսահամար է)
        email: { label: 'Հեռախոսահամար', type: 'text' },
        password: { label: 'Գաղտնաբառ', type: 'password' },
      },
      async authorize(credentials) {
        const raw =
          credentials?.email?.trim() ?? (credentials as { phone?: string } | undefined)?.phone?.trim();
        const password = credentials?.password;
        if (!raw || !password) return null;

        const user = await findUserByPhone(raw);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.phone,
          name: user.name ?? undefined,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = user.role;
        if ('phone' in user && typeof user.phone === 'string') {
          token.phone = user.phone;
        }
        if (user.email) {
          token.email = user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role as Role | undefined) ?? Role.WORKER;
        session.user.phone = (token.phone as string) ?? (token.email as string) ?? '';
        session.user.email = token.email as string | undefined;
      }
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
