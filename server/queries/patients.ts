import { and, asc, count, eq, ilike, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function getPatientsList(page = 1, pageSize = 10, search = '', status = '') {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_LIST)) throw new ForbiddenError();

  const safePage = Math.max(1, page);
  const filters = [isNull(patients.archivedAt)];
  if (search.trim()) filters.push(ilike(patients.fullName, `%${search.trim()}%`));
  if (['INTAKE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'REFERRED'].includes(status))
    filters.push(eq(patients.caseStatus, status as 'INTAKE' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'REFERRED'));
  const where = and(...filters);
  const db = getDb();
  const [total] = await db.select({ value: count() }).from(patients).where(where);
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const items = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      caseStatus: patients.caseStatus,
      createdAt: patients.createdAt,
    })
    .from(patients)
    .where(where)
    .orderBy(asc(patients.fullName))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return { items, currentPage, totalPages, total: total.value };
}

export async function getPatientTherapist(patientId: string) {
  const [therapist] = await getDb()
    .select({ name: users.name, displayName: profiles.displayName })
    .from(patientAssignments)
    .innerJoin(users, eq(patientAssignments.staffUserId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(patientAssignments.patientId, patientId))
    .limit(1);
  return therapist?.displayName ?? therapist?.name ?? null;
}

export async function getUnlinkedUserPatients() {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_CREATE)) throw new ForbiddenError();

  return getDb()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(patients, eq(patients.userId, users.id))
    .where(and(or(eq(profiles.accountType, 'USER'), isNull(profiles.id)), isNull(patients.id)))
    .orderBy(asc(users.name));
}
