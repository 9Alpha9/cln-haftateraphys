import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function getPatientsList(
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  therapistId = '',
) {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_LIST)) throw new ForbiddenError();

  const safePage = Math.max(1, page);
  const db = getDb();
  const filters = [isNull(patients.archivedAt)];
  if (search.trim()) filters.push(ilike(patients.fullName, `%${search.trim()}%`));
  if (['INTAKE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'REFERRED'].includes(status))
    filters.push(eq(patients.caseStatus, status as 'INTAKE' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'REFERRED'));
  if (role === 'THERAPIST') {
    filters.push(
      inArray(
        patients.id,
        db
          .select({ patientId: patientAssignments.patientId })
          .from(patientAssignments)
          .where(
            and(
              eq(patientAssignments.staffUserId, session.user.id),
              isNull(patientAssignments.activeUntil),
            ),
          ),
      ),
    );
  }
  if (therapistId) {
    filters.push(
      inArray(
        patients.id,
        db
          .select({ patientId: patientAssignments.patientId })
          .from(patientAssignments)
          .where(
            and(
              eq(patientAssignments.staffUserId, therapistId),
              isNull(patientAssignments.activeUntil),
            ),
          ),
      ),
    );
  }
  const where = and(...filters);
  const [total] = await db.select({ value: count() }).from(patients).where(where);
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const rows = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      caseStatus: patients.caseStatus,
      createdAt: patients.createdAt,
      medicalRecordNumber: patients.medicalRecordNumber,
      gender: patients.gender,
      dateOfBirth: patients.dateOfBirth,
      nextTherapyAt: patients.nextTherapyAt,
      email: users.email,
      avatarKey: profiles.avatarKey,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(asc(patients.fullName))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const patientIds = rows.map((row) => row.id);
  const therapistRows = patientIds.length
    ? await db
        .select({
          patientId: patientAssignments.patientId,
          name: users.name,
          displayName: profiles.displayName,
        })
        .from(patientAssignments)
        .innerJoin(users, eq(patientAssignments.staffUserId, users.id))
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(and(inArray(patientAssignments.patientId, patientIds), isNull(patientAssignments.activeUntil)))
    : [];
  const therapistByPatient = new Map<string, string>();
  for (const row of therapistRows) {
    const name = row.displayName ?? row.name;
    if (name && !therapistByPatient.has(row.patientId)) {
      therapistByPatient.set(row.patientId, name);
    }
  }
  const items = rows.map((row) => ({
    ...row,
    therapistName: therapistByPatient.get(row.id) ?? null,
  }));

  return { items, currentPage, totalPages, total: total.value };
}

export async function getAssignedTherapistId(patientId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ staffUserId: patientAssignments.staffUserId })
    .from(patientAssignments)
    .where(and(eq(patientAssignments.patientId, patientId), isNull(patientAssignments.activeUntil)))
    .orderBy(asc(patientAssignments.createdAt))
    .limit(1);
  return row?.staffUserId ?? null;
}

export type TherapistOption = { id: string; label: string };

export async function getTherapistOptions(): Promise<TherapistOption[]> {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_LIST)) return [];

  const rows = await getDb()
    .select({
      id: users.id,
      name: users.name,
      displayName: profiles.displayName,
      email: users.email,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(profiles.accountType, 'THERAPIST'), isNull(users.suspendedAt)))
    .orderBy(asc(profiles.displayName), asc(users.name));

  return rows.map((row) => ({
    id: row.id,
    label: row.displayName ?? row.name ?? row.email,
  }));
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

export async function getPatientSelectOptions() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_LIST)) throw new ForbiddenError();

  const db = getDb();
  const filters = [isNull(patients.archivedAt)];
  if (role === 'THERAPIST') {
    filters.push(
      inArray(
        patients.id,
        db
          .select({ patientId: patientAssignments.patientId })
          .from(patientAssignments)
          .where(
            and(
              eq(patientAssignments.staffUserId, session.user.id),
              isNull(patientAssignments.activeUntil),
            ),
          ),
      ),
    );
  }

  return db
    .select({ id: patients.id, label: patients.fullName })
    .from(patients)
    .where(and(...filters))
    .orderBy(asc(patients.fullName));
}

export async function getArchivedPatientsList(page = 1, pageSize = 10, search = '') {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.PATIENT_LIST)) throw new ForbiddenError();

  const safePage = Math.max(1, page);
  const db = getDb();
  const filters = [isNotNull(patients.archivedAt)];
  if (search.trim()) filters.push(ilike(patients.fullName, `%${search.trim()}%`));
  if (role === 'THERAPIST') {
    filters.push(
      inArray(
        patients.id,
        db
          .select({ patientId: patientAssignments.patientId })
          .from(patientAssignments)
          .where(
            and(
              eq(patientAssignments.staffUserId, session.user.id),
              isNull(patientAssignments.activeUntil),
            ),
          ),
      ),
    );
  }
  const where = and(...filters);
  const [total] = await db.select({ value: count() }).from(patients).where(where);
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const items = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      caseStatus: patients.caseStatus,
      createdAt: patients.createdAt,
      archivedAt: patients.archivedAt,
      medicalRecordNumber: patients.medicalRecordNumber,
      email: users.email,
      avatarKey: profiles.avatarKey,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(desc(patients.archivedAt))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return { items, currentPage, totalPages, total: total.value };
}
