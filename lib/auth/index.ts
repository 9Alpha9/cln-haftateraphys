import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import { accounts, sessions, users, verifications } from '@/db/schema';

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: process.env.NODE_ENV === 'production',
    },
    advanced: {
      database: {
        generateId: false,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let _auth: AuthInstance | null = null;

// Lazily initialize so `next build` never evaluates a database connection.
export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

export type Session = AuthInstance['$Infer']['Session'];
