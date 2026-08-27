'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patients, profiles } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { notifyUser } from '@/server/notify';
import { patientProfileSchema, type PatientProfileInput } from '@/lib/validators/patient-profile';

function toNullable(value: string | undefined) {
  return value?.trim() || null;
}

export async function updateCurrentPatientProfile(input: PatientProfileInput) {
  const data = patientProfileSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });

  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  if (patient) {
    await db.transaction(async (tx) => {
      await tx
        .update(patients)
        .set({
          fullName: data.fullName,
          gender: data.gender ?? 'MALE',
          medicalRecordNumber: toNullable(data.medicalRecordNumber),
          dateOfBirth: data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null,
          occupation: toNullable(data.occupation),
          addressLine: toNullable(data.addressLine),
          addressProvince: toNullable(data.addressProvince),
          addressCity: toNullable(data.addressCity),
          emergencyContactName: toNullable(data.emergencyContactName),
          emergencyContactRelationship: toNullable(data.emergencyContactRelationship),
          emergencyContactPhone: toNullable(data.emergencyContactPhone),
          updatedAt: new Date(),
        })
        .where(eq(patients.id, patient.id));
      await tx
        .update(profiles)
        .set({ displayName: toNullable(data.preferredName), phone: toNullable(data.phone), updatedAt: new Date() })
        .where(eq(profiles.userId, session.user.id));
    });
  } else {
    await db.transaction(async (tx) => {
      await tx.insert(patients).values({
        userId: session.user.id,
        fullName: data.fullName,
        gender: data.gender ?? 'MALE',
        medicalRecordNumber: toNullable(data.medicalRecordNumber),
        dateOfBirth: data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null,
        occupation: toNullable(data.occupation),
        addressLine: toNullable(data.addressLine),
        addressProvince: toNullable(data.addressProvince),
        addressCity: toNullable(data.addressCity),
        emergencyContactName: toNullable(data.emergencyContactName),
        emergencyContactRelationship: toNullable(data.emergencyContactRelationship),
        emergencyContactPhone: toNullable(data.emergencyContactPhone),
      });
      await tx
        .update(profiles)
        .set({ displayName: toNullable(data.preferredName), phone: toNullable(data.phone), updatedAt: new Date() })
        .where(eq(profiles.userId, session.user.id));
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');

  await notifyUser({
    userId: session.user.id,
    title: 'Profil diperbarui',
    message: 'Data diri Anda berhasil diperbarui.',
    actionUrl: '/dashboard/profile',
  });
}
