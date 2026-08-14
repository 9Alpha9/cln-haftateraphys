import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/permissions';

export class UnauthenticatedError extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

export async function requireSession(options?: { redirectToLogin?: boolean }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    if (options?.redirectToLogin) {
      redirect('/login');
    }
    throw new UnauthenticatedError();
  }

  const db = getDb();
  const [profile] = await db
    .select({ accountType: profiles.accountType })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const role = (profile?.accountType as Role) ?? 'USER';

  return { session, role };
}
