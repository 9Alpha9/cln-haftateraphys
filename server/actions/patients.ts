'use server';

import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function archivePatient(patientId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PATIENT_ARCHIVE)) throw new ForbiddenError();

  const result = await getDb()
    .update(patients)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(patients.id, patientId), isNull(patients.archivedAt)))
    .returning({ id: patients.id });
  if (result.length === 0) throw new Error('Pasien tidak ditemukan atau sudah diarsipkan.');

  await createAuditLog({
    action: 'patient.archive',
    targetType: 'patient',
    targetId: patientId,
    userId: session.user.id,
  });

  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/appointments');
}

export async function restorePatient(patientId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PATIENT_ARCHIVE)) throw new ForbiddenError();

  const result = await getDb()
    .update(patients)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(and(eq(patients.id, patientId), isNotNull(patients.archivedAt)))
    .returning({ id: patients.id });
  if (result.length === 0) throw new Error('Pasien tidak ditemukan atau belum diarsipkan.');

  await createAuditLog({
    action: 'patient.restore',
    targetType: 'patient',
    targetId: patientId,
    userId: session.user.id,
  });

  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/patients/archived');
  revalidatePath('/dashboard/appointments');
}

export async function createPatientFromUser(userId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PATIENT_CREATE)) throw new ForbiddenError();

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, name: users.name, profileId: profiles.id, accountType: profiles.accountType })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(patients, eq(patients.userId, users.id))
    .where(and(eq(users.id, userId), or(eq(profiles.accountType, 'USER'), isNull(profiles.id)), isNull(patients.id)))
    .limit(1);

  if (!user) throw new Error('Akun pasien tidak tersedia.');
  const createPatient = db
    .insert(patients)
    .values({ userId: user.id, fullName: user.name?.trim() || 'Pasien' })
    .returning({ id: patients.id });

  if (!user.profileId) {
    await db.batch([
      db.insert(profiles).values({ userId: user.id, accountType: 'USER' }),
      createPatient,
    ]);
  } else {
    await createPatient;
  }

  const [created] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, user.id))
    .limit(1);

  if (role === 'THERAPIST' && created?.id) {
    await db
      .insert(patientAssignments)
      .values({
        patientId: created.id,
        staffUserId: session.user.id,
        assignmentType: 'PRIMARY_THERAPIST',
        createdBy: session.user.id,
      })
      .onConflictDoNothing();
  }

  await createAuditLog({
    action: 'patient.create',
    targetType: 'patient',
    targetId: created?.id,
    meta: { userId: user.id },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/appointments');
}
