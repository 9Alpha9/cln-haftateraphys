import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import type { Role } from '@/lib/permissions/roles';

export type StaffProfileView = {
  name: string;
  email: string;
  displayName: string;
  phone: string;
  avatarKey: string | null;
  role: Role;
};

export async function getCurrentStaffProfile(): Promise<StaffProfileView> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const db = getDb();
  const [row] = await db
    .select({
      name: users.name,
      email: users.email,
      displayName: profiles.displayName,
      phone: profiles.phone,
      avatarKey: profiles.avatarKey,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  return {
    name: row?.name ?? session.user.name ?? '',
    email: row?.email ?? session.user.email ?? '',
    displayName: row?.displayName ?? '',
    phone: row?.phone ?? '',
    avatarKey: row?.avatarKey ?? null,
    role,
  };
}
