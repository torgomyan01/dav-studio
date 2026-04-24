import type { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone: string;
      email?: string | null;
      name?: string | null;
      role: Role;
    };
  }

  interface User {
    role: Role;
    phone: string;
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    phone?: string;
  }
}
