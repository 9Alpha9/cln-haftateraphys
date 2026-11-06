import { and, asc, count, eq, ilike, isNotNull, isNull, or } from 'drizzle-orm';
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
  suspendedAt: Date | null;
  createdAt: Date;
};

export async function getUsersList(
  page = 1,
  pageSize = 10,
  search = '',
  roleFilter = '',
  statusFilter: 'active' | 'suspended' | '' = '',
) {
  const { role } = await requireSession({ redirectToLogin: true });

  if (!hasPermission(role, PERMISSIONS.USER_LIST)) {
    return { items: [] as UserView[], currentPage: 1, totalPages: 1, total: 0 };
  }

  const db = getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const term = search.trim();
  const filters = [];
  if (term) {
    filters.push(
      or(
        ilike(users.name, `%${term}%`),
        ilike(users.email, `%${term}%`),
        ilike(users.username, `%${term}%`),
        ilike(profiles.displayName, `%${term}%`),
      ),
    );
  }
  if (['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF', 'USER'].includes(roleFilter)) {
    filters.push(
      eq(profiles.accountType, roleFilter as 'SUPER_ADMIN' | 'ADMIN' | 'THERAPIST' | 'STAFF' | 'USER'),
    );
  }
  if (statusFilter === 'active') filters.push(isNull(users.suspendedAt));
  if (statusFilter === 'suspended') filters.push(isNotNull(users.suspendedAt));
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalResult] = await db
    .select({ value: count(users.id) })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where);
  const totalPages = Math.max(1, Math.ceil(totalResult.value / safePageSize));
  const currentPage = Math.min(safePage, totalPages);

  const items = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      displayName: profiles.displayName,
      phone: profiles.phone,
      accountType: profiles.accountType,
      suspendedAt: users.suspendedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(asc(users.createdAt))
    .limit(safePageSize)
    .offset((currentPage - 1) * safePageSize);

  return { items, currentPage, totalPages, total: totalResult.value };
}
