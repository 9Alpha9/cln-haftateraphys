import { asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export type UserView = {
  id: string;
  name: string | null;
  email: string;
  displayName: string | null;
  phone: string | null;
  accountType: string | null;
  createdAt: Date;
};

export async function getUsersList(page = 1, pageSize = 10) {
  const { role } = await requireSession({ redirectToLogin: true });

  if (!hasPermission(role, PERMISSIONS.USER_LIST)) {
    return { items: [] as UserView[], currentPage: 1, totalPages: 1, total: 0 };
  }

  const db = getDb();
  const safePage = Math.max(1, page);
  const [totalResult] = await db.select({ value: count() }).from(users);
  const totalPages = Math.max(1, Math.ceil(totalResult.value / pageSize));
  const currentPage = Math.min(safePage, totalPages);

  const items = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      displayName: profiles.displayName,
      phone: profiles.phone,
      accountType: profiles.accountType,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(asc(users.createdAt))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return { items, currentPage, totalPages, total: totalResult.value };
}
