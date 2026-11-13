import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { sessions, users } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Role } from '@/lib/permissions';

export class UnauthenticatedError extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

async function loadSession(redirectToLogin: boolean) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    if (redirectToLogin) {
      // Dashboard adalah pintu masuk pasien. Pengunjung tanpa akun diarahkan
      // untuk membuat akun terlebih dahulu, dengan tautan login tersedia di
      // halaman pendaftaran bagi pasien yang sudah memiliki akun.
      const pathname = (await headers()).get('x-pathname') ?? '';
      if (pathname.startsWith('/dashboard')) {
        redirect('/register?reason=portal');
      }
      redirect('/login');
    }
    throw new UnauthenticatedError();
  }

  const db = getDb();
  const [account] = await db
    .select({ accountType: profiles.accountType, suspendedAt: users.suspendedAt })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (account?.suspendedAt) {
    // Revoke active sessions immediately so a suspended account cannot keep
    // accessing clinical data with an existing cookie.
    await db.delete(sessions).where(eq(sessions.userId, session.user.id));
    if (redirectToLogin) {
      redirect('/login?reason=suspended');
    }
    throw new UnauthenticatedError();
  }

  const role = (account?.accountType as Role) ?? 'USER';

  return { session, role };
}

// Dedupe session + profile lookups across layout, page, and nested server
// components within the same request. This removes the repeated auth
// round-trips that made client-side navigation feel slow.
const getCachedSession = cache((redirectToLogin: boolean) => loadSession(redirectToLogin));

export async function requireSession(options?: { redirectToLogin?: boolean }) {
  return getCachedSession(options?.redirectToLogin ?? false);
}
