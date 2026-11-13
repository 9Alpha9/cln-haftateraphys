import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { twoFactor } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import { accounts, sessions, twoFactor as twoFactorTable, users, verifications } from '@/db/schema';
import { createAuditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email/send-email';

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        twoFactor: twoFactorTable,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        const sent = await sendEmail({
          to: user.email,
          subject: 'Reset kata sandi Hafta Fisioterapi',
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181700">
              <h2>Reset kata sandi</h2>
              <p>Halo ${user.name || 'Pasien'},</p>
              <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Hafta Fisioterapi Anda.</p>
              <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#FFD097;color:#181700;text-decoration:none;border-radius:999px;font-weight:700">Atur ulang kata sandi</a></p>
              <p>Tautan berlaku selama 1 jam. Jika Anda tidak meminta reset, abaikan email ini.</p>
            </div>
          `,
          text: `Halo ${user.name || 'Pasien'},\n\nAtur ulang kata sandi Anda: ${url}\n\nTautan berlaku 1 jam. Abaikan email ini jika bukan Anda.`,
        });

        await createAuditLog({
          action: 'user.password-reset-requested',
          targetType: 'user',
          targetId: user.id,
          meta: { emailSent: sent },
          userId: user.id,
        });
      },
    },
    emailVerification: {
      expiresIn: 60 * 60,
      sendOnSignUp: false,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const sent = await sendEmail({
          to: user.email,
          subject: 'Verifikasi email Hafta Fisioterapi',
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181700">
              <h2>Verifikasi email</h2>
              <p>Halo ${user.name || 'Pasien'},</p>
              <p>Konfirmasi alamat email Anda untuk mengamankan akun Hafta Fisioterapi.</p>
              <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#FFD097;color:#181700;text-decoration:none;border-radius:999px;font-weight:700">Verifikasi email</a></p>
              <p>Tautan berlaku selama 1 jam.</p>
            </div>
          `,
          text: `Halo ${user.name || 'Pasien'},\n\nVerifikasi email Anda: ${url}\n\nTautan berlaku 1 jam.`,
        });

        await createAuditLog({
          action: 'user.verification-requested',
          targetType: 'user',
          targetId: user.id,
          meta: { emailSent: sent },
          userId: user.id,
        });
      },
    },
    username: {
      enabled: true,
    },
    plugins: [
      twoFactor({
        issuer: 'Hafta Fisioterapi',
        skipVerificationOnEnable: false,
      }),
    ],
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
