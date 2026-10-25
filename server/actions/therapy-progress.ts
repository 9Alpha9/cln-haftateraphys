'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { appointments, notifications, patients, therapyProgressRecords } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

const scoreField = z.coerce.number().int().min(0).max(10);

const progressSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  painScore: scoreField,
  rangeOfMotionScore: scoreField,
  strengthScore: scoreField,
  functionScore: scoreField,
  anamnesis: z.string().max(3000).optional(),
  physicalExamination: z.string().max(3000).optional(),
  diagnosis: z.string().max(3000).optional(),
  treatment: z.string().max(3000).optional(),
  followUpPlan: z.string().max(3000).optional(),
  summary: z.string().max(2000).optional(),
  patientVisible: z.coerce.number().int().min(0).max(1).default(0),
});

export type SaveProgressResult = { ok: true; id: string } | { ok: false; error: string };
export type FinalizeProgressResult = { ok: true } | { ok: false; error: string };

async function assertScope(patientId: string, therapistId: string, role: string) {
  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!patient) throw new ForbiddenError();
}

async function notifyProgress(db: any, patientId: string, therapistId: string, isFinalized: boolean, isVisibleToPatient: boolean) {
  const [patient] = await db
    .select({ userId: patients.userId, fullName: patients.fullName })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (patient) {
    if (isFinalized && isVisibleToPatient) {
      await db.insert(notifications).values({
        userId: patient.userId,
        title: 'Evaluasi Rekam Medis',
        message: 'Terapis telah memperbarui evaluasi rekam medis Anda.',
        actionUrl: '/dashboard/progress',
      });
    }

    // Notifikasi untuk terapis (log record)
    await db.insert(notifications).values({
      userId: therapistId,
      title: isFinalized ? 'Evaluasi Difinalisasi' : 'Draft Evaluasi Disimpan',
      message: `Berhasil mencatat evaluasi untuk ${patient.fullName}.`,
      actionUrl: `/dashboard/patients/${patientId}`,
    });
  }
}

export async function saveTherapyProgress(input: unknown): Promise<SaveProgressResult> {
  try {
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
      return { ok: false, error: 'Anda tidak memiliki izin mencatat progress.' };
    }
    const data = progressSchema.parse(input);
    await assertScope(data.patientId, session.user.id, role);
    const db = getDb();

    if (data.appointmentId) {
      const [appointment] = await db
        .select({
          patientId: appointments.patientId,
          therapistId: appointments.therapistId,
        })
        .from(appointments)
        .where(eq(appointments.id, data.appointmentId))
        .limit(1);
      if (!appointment || appointment.patientId !== data.patientId) {
        return { ok: false, error: 'Sesi terapi tidak cocok dengan pasien ini.' };
      }
      if (role === 'THERAPIST' && appointment.therapistId !== session.user.id) {
        return { ok: false, error: 'Anda tidak memiliki akses ke sesi ini.' };
      }
    }

    const [inserted] = await db
      .insert(therapyProgressRecords)
      .values({
        patientId: data.patientId,
        therapistId: session.user.id,
        appointmentId: data.appointmentId ?? null,
        painScore: data.painScore,
        rangeOfMotionScore: data.rangeOfMotionScore,
        strengthScore: data.strengthScore,
        functionScore: data.functionScore,
        anamnesis: data.anamnesis?.trim() ?? null,
        physicalExamination: data.physicalExamination?.trim() ?? null,
        diagnosis: data.diagnosis?.trim() ?? null,
        treatment: data.treatment?.trim() ?? null,
        followUpPlan: data.followUpPlan?.trim() ?? null,
        summary: data.summary?.trim() ?? null,
        patientVisible: data.patientVisible,
        status: 'DRAFT',
      })
      .returning({ id: therapyProgressRecords.id });
    await createAuditLog({
      action: 'progress.create',
      targetType: 'therapy_progress_record',
      targetId: inserted.id,
      meta: { patientId: data.patientId, appointmentId: data.appointmentId ?? null },
      userId: session.user.id,
    });

    await notifyProgress(db, data.patientId, session.user.id, false, data.patientVisible === 1);

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/progress');
    return { ok: true, id: inserted.id };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: 'Data tidak valid: ' + e.issues[0]?.message };
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal menyimpan.' };
  }
}

export async function finalizeTherapyProgress(progressId: string): Promise<FinalizeProgressResult> {
  try {
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
      return { ok: false, error: 'Anda tidak memiliki izin.' };
    }
    const db = getDb();
    const [record] = await db
      .select({
        id: therapyProgressRecords.id,
        status: therapyProgressRecords.status,
        therapistId: therapyProgressRecords.therapistId,
        patientId: therapyProgressRecords.patientId,
        patientVisible: therapyProgressRecords.patientVisible,
      })
      .from(therapyProgressRecords)
      .where(eq(therapyProgressRecords.id, progressId))
      .limit(1);
    if (!record) return { ok: false, error: 'Rekam tidak ditemukan.' };
    if (record.status === 'FINALIZED') return { ok: false, error: 'Rekam sudah difinalisasi.' };
    if (role === 'THERAPIST' && record.therapistId !== session.user.id) {
      return { ok: false, error: 'Anda tidak memiliki akses ke rekam ini.' };
    }
    await db
      .update(therapyProgressRecords)
      .set({ status: 'FINALIZED', finalizedAt: new Date(), finalizedBy: session.user.id, updatedAt: new Date() })
      .where(eq(therapyProgressRecords.id, progressId));

    await notifyProgress(db, record.patientId, session.user.id, true, record.patientVisible === 1);

    await createAuditLog({
      action: 'progress.finalize',
      targetType: 'therapy_progress_record',
      targetId: progressId,
      userId: session.user.id,
    });
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/progress');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal memfinalisasi.' };
  }
}

const updateProgressSchema = progressSchema.extend({
  recordId: z.string().uuid(),
  status: z.enum(['DRAFT', 'FINALIZED']),
});

export type UpdateProgressResult = { ok: true } | { ok: false; error: string };

export async function updateTherapyProgress(input: unknown): Promise<UpdateProgressResult> {
  try {
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
      return { ok: false, error: 'Anda tidak memiliki izin mengubah rekam medis.' };
    }

    const data = updateProgressSchema.parse(input);
    const db = getDb();
    const [record] = await db
      .select({
        id: therapyProgressRecords.id,
        patientId: therapyProgressRecords.patientId,
        therapistId: therapyProgressRecords.therapistId,
        status: therapyProgressRecords.status,
      })
      .from(therapyProgressRecords)
      .where(eq(therapyProgressRecords.id, data.recordId))
      .limit(1);

    if (!record) return { ok: false, error: 'Rekam medis tidak ditemukan.' };
    if (role === 'THERAPIST' && record.therapistId !== session.user.id) {
      return { ok: false, error: 'Anda tidak memiliki akses ke rekam ini.' };
    }

    const now = new Date();
    await db
      .update(therapyProgressRecords)
      .set({
        painScore: data.painScore,
        rangeOfMotionScore: data.rangeOfMotionScore,
        strengthScore: data.strengthScore,
        functionScore: data.functionScore,
        anamnesis: data.anamnesis?.trim() ?? null,
        physicalExamination: data.physicalExamination?.trim() ?? null,
        diagnosis: data.diagnosis?.trim() ?? null,
        treatment: data.treatment?.trim() ?? null,
        followUpPlan: data.followUpPlan?.trim() ?? null,
        summary: data.summary?.trim() ?? null,
        patientVisible: data.patientVisible,
        status: data.status,
        finalizedAt: data.status === 'FINALIZED' ? now : null,
        finalizedBy: data.status === 'FINALIZED' ? session.user.id : null,
        updatedAt: now,
      })
      .where(eq(therapyProgressRecords.id, data.recordId));

    await createAuditLog({
      action: 'progress.update',
      targetType: 'therapy_progress_record',
      targetId: data.recordId,
      meta: { patientId: record.patientId, status: data.status },
      userId: session.user.id,
    });

    await notifyProgress(db, record.patientId, session.user.id, data.status === 'FINALIZED', data.patientVisible === 1);

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/progress');
    revalidatePath(`/dashboard/patients/${record.patientId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: 'Data tidak valid: ' + e.issues[0]?.message };
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal memperbarui rekam medis.' };
  }
}
