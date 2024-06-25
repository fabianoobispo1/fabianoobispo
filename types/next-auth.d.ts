import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      tipo: string;
      provider: string;
    } & DefaultSession['user'];
  }

  interface User {
    tipo: string;
    provider: string;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tipo: string;
    provider: string;
  }
}
