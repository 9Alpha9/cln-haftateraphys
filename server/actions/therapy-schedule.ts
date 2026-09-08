'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { therapyScheduleSchema, type TherapyScheduleInput } from '@/lib/validators/therapy-schedule';

function toNullable(value: string | undefined) {
  if (value == null) return null;
  const t = value.trim();
  return t || null;
}

function toNullableDate(value: string | undefined) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

export async function updateTherapySchedule(patientId: string, input: TherapyScheduleInput) {
  const { role } = await requireSession({ redirectToLogin: false });
  if (
    role === 'USER' ||
    !(
      hasPermission(role, PERMISSIONS.PATIENT_UPDATE_DEMOGRAPHICS) ||
      hasPermission(role, PERMISSIONS.INTAKE_REVIEW)
    )
  ) {
    throw new ForbiddenError();
  }

  const data = therapyScheduleSchema.parse(input);

  const result = await getDb()
    .update(patients)
    .set({
      nextTherapyAt: toNullableDate(data.nextTherapyAt),
      therapyFrequencyText: toNullable(data.therapyFrequencyText),
      therapyGoal: toNullable(data.therapyGoal),
      therapistNote: toNullable(data.therapistNote),
      therapistNoteAuthor: role,
      therapistNoteAt: data.therapistNote?.trim() ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(patients.id, patientId))
    .returning({ id: patients.id });

  if (result.length === 0) throw new Error('Pasien tidak ditemukan.');

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/patients/${patientId}`);
}
