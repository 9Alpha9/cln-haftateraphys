'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { patientIntakes, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { intakeDraftSchema, intakeSubmitSchema, type IntakeDraftInput } from '@/lib/validators/patient-intake';
import { notifyUser } from '@/server/notify';

type IntakeSubmissionMode = 'draft' | 'submit';

export type StartIntakeResult =
  | { success: true }
  | { success: false; reason: 'ROLE_NOT_ALLOWED' | 'STILL_IN_REVIEW' | 'HAS_ACTIVE_DRAFT' | 'ERROR' };

async function getOrCreateCurrentPatient(userId: string, fullName: string | null | undefined) {
  const db = getDb();
  const [existingPatient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);

  if (existingPatient) {
    return existingPatient;
  }

  const [patient] = await db
    .insert(patients)
    .values({ userId, fullName: fullName?.trim() || 'Pasien' })
    .returning({ id: patients.id });

  return patient;
}

function toNullable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export async function startNewPatientIntake(): Promise<StartIntakeResult> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.INTAKE_CREATE_OWN)) {
    return { success: false, reason: 'ROLE_NOT_ALLOWED' };
  }

  const patient = await getOrCreateCurrentPatient(session.user.id, session.user.name);
  const db = getDb();
  const [latestIntake] = await db
    .select({ id: patientIntakes.id, status: patientIntakes.status, version: patientIntakes.version })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patient.id))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (!latestIntake) {
    try {
      await db.insert(patientIntakes).values({
        patientId: patient.id,
        version: 1,
        status: 'DRAFT',
        dataAccuracyAcknowledged: 0,
      });
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/intake');
      revalidatePath('/dashboard/history');
      return { success: true };
    } catch (error) {
      console.error('[startNewPatientIntake error]:', error);
      return { success: false, reason: 'ERROR' };
    }
  }

  if (latestIntake.status === 'SUBMITTED' || latestIntake.status === 'UNDER_REVIEW') {
    return { success: false, reason: 'STILL_IN_REVIEW' };
  }

  if (latestIntake.status === 'DRAFT' || latestIntake.status === 'NEEDS_REVISION') {
    return { success: false, reason: 'HAS_ACTIVE_DRAFT' };
  }

  if (latestIntake.status !== 'ACCEPTED' && latestIntake.status !== 'ARCHIVED') {
    return { success: false, reason: 'ERROR' };
  }

  try {
    const nextVersion = (latestIntake.version ?? 0) + 1;
    await db.batch([
      db
        .update(patientIntakes)
        .set({ status: 'ARCHIVED', updatedAt: new Date() })
        .where(eq(patientIntakes.id, latestIntake.id)),
      db.insert(patientIntakes).values({
        patientId: patient.id,
        version: nextVersion,
        status: 'DRAFT',
        dataAccuracyAcknowledged: 0,
      }),
    ]);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/intake');
    revalidatePath('/dashboard/history');

    await notifyUser({
      userId: session.user.id,
      title: 'Versi Form Awal baru',
      message: 'Form Awal versi baru telah dibuat dan siap diisi.',
      actionUrl: '/dashboard/intake',
    });

    return { success: true };
  } catch (error) {
    console.error('[startNewPatientIntake error]:', error);
    return { success: false, reason: 'ERROR' };
  }
}

export async function savePatientIntake(input: IntakeDraftInput, mode: IntakeSubmissionMode) {
  const data = (mode === 'submit' ? intakeSubmitSchema : intakeDraftSchema).parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  const requiredPermission = mode === 'submit' ? PERMISSIONS.INTAKE_CREATE_OWN : PERMISSIONS.INTAKE_UPDATE_OWN_DRAFT;

  if (role !== 'USER' || !hasPermission(role, requiredPermission)) {
    throw new ForbiddenError();
  }

  const patient = await getOrCreateCurrentPatient(session.user.id, session.user.name);
  const db = getDb();

  const [latestIntake] = await db
    .select({
      id: patientIntakes.id,
      status: patientIntakes.status,
      version: patientIntakes.version,
      submittedAt: patientIntakes.submittedAt,
    })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patient.id))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (latestIntake) {
    const isLocked = latestIntake.status === 'ACCEPTED' || latestIntake.status === 'ARCHIVED';

    if (isLocked) {
      throw new ForbiddenError('Form intake yang sudah diterima bersifat referensi dan tidak dapat diubah.');
    }
  }

  const targetVersion = latestIntake ? latestIntake.version : 1;
  const keepReviewStatus =
    latestIntake?.status === 'SUBMITTED' || latestIntake?.status === 'UNDER_REVIEW';
  const targetStatus =
    mode === 'submit'
      ? 'SUBMITTED'
      : keepReviewStatus
        ? latestIntake.status
        : 'DRAFT';

  const payload = {
    chiefComplaint: toNullable(data.chiefComplaint),
    affectedArea: toNullable(data.affectedArea),
    onsetDescription: toNullable(data.onsetDescription),
    triggeringEvent: toNullable(data.triggeringEvent),
    aggravatingFactors: toNullable(data.aggravatingFactors),
    relievingFactors: toNullable(data.relievingFactors),
    dailyLimitations: toNullable(data.dailyLimitations),
    previousInjuryHistory: toNullable(data.previousInjuryHistory),
    surgeryHistory: toNullable(data.surgeryHistory),
    relevantMedicalHistory: toNullable(data.relevantMedicalHistory),
    currentMedication: toNullable(data.currentMedication),
    allergies: toNullable(data.allergies),
    patientGoal: toNullable(data.patientGoal),
    dataAccuracyAcknowledged: data.dataAccuracyAcknowledged ? 1 : 0,
    status: targetStatus as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW',
    submittedAt:
      mode === 'submit'
        ? new Date()
        : keepReviewStatus
          ? latestIntake.submittedAt
          : null,
    updatedAt: new Date(),
  };

  if (latestIntake) {
    await db
      .update(patientIntakes)
      .set(payload)
      .where(and(eq(patientIntakes.id, latestIntake.id), eq(patientIntakes.patientId, patient.id)));
  } else {
    await db.insert(patientIntakes).values({
      ...payload,
      patientId: patient.id,
      version: targetVersion,
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/intake');
  revalidatePath('/dashboard/history');

  if (mode === 'submit') {
    await notifyUser({
      userId: session.user.id,
      title: 'Form Awal Terkirim',
      message: 'Form Awal Anda telah berhasil dikirim dan sedang menunggu tinjauan dari tim fisioterapis Hafta.',
      actionUrl: '/dashboard/intake',
    });
  }
}
