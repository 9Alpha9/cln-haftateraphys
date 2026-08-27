'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { patients, therapyProgressRecords } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

const scoreField = z.coerce.number().int().min(0).max(10);

const progressSchema = z.object({
  patientId: z.string().uuid(),
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

export async function saveTherapyProgress(input: unknown): Promise<SaveProgressResult> {
  try {
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
      return { ok: false, error: 'Anda tidak memiliki izin mencatat progress.' };
    }
    const data = progressSchema.parse(input);
    await assertScope(data.patientId, session.user.id, role);
    const db = getDb();
    const [inserted] = await db
      .insert(therapyProgressRecords)
      .values({
        patientId: data.patientId,
        therapistId: session.user.id,
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
      meta: { patientId: data.patientId },
      userId: session.user.id,
    });
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
      .select({ id: therapyProgressRecords.id, status: therapyProgressRecords.status, therapistId: therapyProgressRecords.therapistId })
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
    await createAuditLog({
      action: 'progress.finalize',
      targetType: 'therapy_progress_record',
      targetId: progressId,
      userId: session.user.id,
    });
    revalidatePath('/dashboard/progress');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gagal memfinalisasi.' };
  }
}
