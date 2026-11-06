import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import { accounts, sessions, users, verifications } from '@/db/schema';
import { createAuditLog } from '@/lib/audit';

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
      requireEmailVerification: false,
    },
    username: {
      enabled: true,
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
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const [account] = await getDb()
              .select({ suspendedAt: users.suspendedAt })
              .from(users)
              .where(eq(users.id, session.userId))
              .limit(1);
            if (account?.suspendedAt) {
              throw APIError.from('FORBIDDEN', {
                message: 'Akun Anda sedang ditangguhkan.',
                code: 'ACCOUNT_SUSPENDED',
              });
            }
          },
          after: async (session) => {
            await createAuditLog({
              action: 'user.login',
              targetType: 'session',
              targetId: session.id,
              meta: { userId: session.userId },
              userId: session.userId,
            });
          },
        },
        delete: {
          after: async (session) => {
            await createAuditLog({
              action: 'user.logout',
              targetType: 'session',
              targetId: session.id,
              meta: { userId: session.userId },
              userId: session.userId,
            });
          },
        },
      },
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
