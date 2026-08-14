'use server';

import { and, eq, isNull, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function archivePatient(patientId: string) {
  const { role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PATIENT_ARCHIVE)) throw new ForbiddenError();

  const result = await getDb()
    .update(patients)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(patients.id, patientId), isNull(patients.archivedAt)))
    .returning({ id: patients.id });
  if (result.length === 0) throw new Error('Pasien tidak ditemukan atau sudah diarsipkan.');
  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/appointments/new');
}

export async function createPatientFromUser(userId: string) {
  const { role } = await requireSession({ redirectToLogin: false });
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
  await db.transaction(async (tx) => {
    if (!user.profileId) await tx.insert(profiles).values({ userId: user.id, accountType: 'USER' });
    await tx.insert(patients).values({ userId: user.id, fullName: user.name?.trim() || 'Pasien' });
  });
  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/appointments/new');
}
