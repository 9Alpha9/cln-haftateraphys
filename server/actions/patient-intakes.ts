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

export async function startNewPatientIntake() {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.INTAKE_CREATE_OWN)) throw new ForbiddenError();

  const patient = await getOrCreateCurrentPatient(session.user.id, session.user.name);
  const db = getDb();
  const [latestIntake] = await db
    .select({ id: patientIntakes.id, status: patientIntakes.status, version: patientIntakes.version })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patient.id))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (!latestIntake || (latestIntake.status !== 'ACCEPTED' && latestIntake.status !== 'ARCHIVED'))
    throw new ForbiddenError();

  await db.transaction(async (tx) => {
    await tx
      .update(patientIntakes)
      .set({ status: 'ARCHIVED', updatedAt: new Date() })
      .where(eq(patientIntakes.id, latestIntake.id));
    await tx
      .insert(patientIntakes)
      .values({ patientId: patient.id, version: latestIntake.version + 1, status: 'DRAFT' });
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/intake');
  revalidatePath('/dashboard/history');

  await notifyUser({
    userId: session.user.id,
    title: 'Versi Form Awal baru',
    message: 'Form Awal versi baru telah dibuat dan siap diisi.',
    actionUrl: '/dashboard/intake',
  });
}

export async function savePatientIntake(input: IntakeDraftInput, mode: IntakeSubmissionMode) {
  const data = (mode === 'submit' ? intakeSubmitSchema : intakeDraftSchema).parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  const requiredPermission = mode === 'submit' ? PERMISSIONS.INTAKE_CREATE_OWN : PERMISSIONS.INTAKE_UPDATE_OWN_DRAFT;

  if (role !== 'USER' || !hasPermission(role, requiredPermission)) {
    throw new ForbiddenError();
  }

  if (mode === 'submit' && !data.dataAccuracyAcknowledged) {
    throw new Error('Konfirmasi ketepatan data diperlukan sebelum mengirim Form Awal.');
  }

  const patient = await getOrCreateCurrentPatient(session.user.id, session.user.name);
  const db = getDb();
  const [latestIntake] = await db
    .select({ id: patientIntakes.id, status: patientIntakes.status })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patient.id))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (latestIntake && latestIntake.status !== 'DRAFT' && latestIntake.status !== 'NEEDS_REVISION') {
    throw new ForbiddenError();
  }

  const values = {
    chiefComplaint: data.chiefComplaint,
    affectedArea: data.affectedArea,
    onsetDescription: toNullable(data.onsetDescription),
    triggeringEvent: toNullable(data.triggeringEvent),
    aggravatingFactors: toNullable(data.aggravatingFactors),
    relievingFactors: toNullable(data.relievingFactors),
    dailyLimitations: data.dailyLimitations,
    previousInjuryHistory: toNullable(data.previousInjuryHistory),
    surgeryHistory: toNullable(data.surgeryHistory),
    relevantMedicalHistory: toNullable(data.relevantMedicalHistory),
    currentMedication: toNullable(data.currentMedication),
    allergies: toNullable(data.allergies),
    patientGoal: data.patientGoal,
    dataAccuracyAcknowledged: data.dataAccuracyAcknowledged ? 1 : 0,
    status: mode === 'submit' ? ('SUBMITTED' as const) : ('DRAFT' as const),
    submittedAt: mode === 'submit' ? new Date() : null,
    updatedAt: new Date(),
  };

  if (latestIntake) {
    await db
      .update(patientIntakes)
      .set(values)
      .where(and(eq(patientIntakes.id, latestIntake.id), eq(patientIntakes.patientId, patient.id)));
  } else {
    await db.insert(patientIntakes).values({ patientId: patient.id, version: 1, ...values });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/intake');

  await notifyUser({
    userId: session.user.id,
    title: mode === 'submit' ? 'Form Awal dikirim' : 'Draft Form Awal disimpan',
    message:
      mode === 'submit'
        ? 'Form Awal Anda telah dikirim untuk ditinjau oleh tim klinis.'
        : 'Perubahan draft Form Awal Anda telah disimpan.',
    actionUrl: '/dashboard/intake',
  });
}
