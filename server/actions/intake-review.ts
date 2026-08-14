'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { notifications, patientIntakes, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { intakeReviewSchema, type IntakeReviewInput } from '@/lib/validators/intake-review';

export async function archivePatientIntake(patientId: string) {
  const { role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.INTAKE_ARCHIVE)) throw new ForbiddenError();

  const db = getDb();
  const [intake] = await db
    .select({ id: patientIntakes.id, status: patientIntakes.status })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patientId))
    .orderBy(desc(patientIntakes.version))
    .limit(1);
  if (!intake || intake.status === 'ARCHIVED') throw new Error('Form Awal tidak dapat diarsipkan.');
  await db
    .update(patientIntakes)
    .set({ status: 'ARCHIVED', updatedAt: new Date() })
    .where(eq(patientIntakes.id, intake.id));
  revalidatePath('/dashboard/intake');
  revalidatePath(`/dashboard/patients/${patientId}/intake`);
}

export async function reviewPatientIntake(input: IntakeReviewInput) {
  const data = intakeReviewSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  const permission =
    data.action === 'request-revision'
      ? PERMISSIONS.INTAKE_REQUEST_REVISION
      : data.action === 'accept'
        ? PERMISSIONS.INTAKE_ACCEPT
        : PERMISSIONS.INTAKE_REVIEW;

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }

  if (role === 'USER') throw new ForbiddenError();
  const db = getDb();
  const [intake] = await db
    .select({ id: patientIntakes.id, status: patientIntakes.status })
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, data.patientId))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  if (!intake) throw new Error('Form Awal tidak ditemukan.');
  const validTransition =
    (data.action === 'start-review' && intake.status === 'SUBMITTED') ||
    (data.action === 'request-revision' && intake.status === 'UNDER_REVIEW') ||
    (data.action === 'accept' && intake.status === 'UNDER_REVIEW');
  if (!validTransition) throw new ForbiddenError();

  await db
    .update(patientIntakes)
    .set({
      status:
        data.action === 'start-review'
          ? 'UNDER_REVIEW'
          : data.action === 'request-revision'
            ? 'NEEDS_REVISION'
            : 'ACCEPTED',
      reviewMessage: data.action === 'request-revision' ? data.reviewMessage?.trim() || null : null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(patientIntakes.id, intake.id), eq(patientIntakes.patientId, data.patientId)));

  if (data.action === 'request-revision' || data.action === 'accept') {
    const [patient] = await db
      .select({ userId: patients.userId })
      .from(patients)
      .where(eq(patients.id, data.patientId))
      .limit(1);
    if (patient?.userId) {
      await db.insert(notifications).values({
        userId: patient.userId,
        title: data.action === 'request-revision' ? 'Perbaikan Form Awal' : 'Form Awal Diterima',
        message:
          data.action === 'request-revision' ? data.reviewMessage?.trim() || null : null,
      });
    }
  }

  revalidatePath('/dashboard/intake');
  revalidatePath(`/dashboard/patients/${data.patientId}/intake`);
  revalidatePath('/dashboard/history');
}
