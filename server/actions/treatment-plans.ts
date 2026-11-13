'use server';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { patientAssignments, patients, treatmentPlans } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { notifyUser } from '@/server/notify';

const treatmentPlanSchema = z.object({
  patientId: z.string().uuid(),
  goals: z.string().trim().min(5, 'Tujuan terapi wajib diisi minimal 5 karakter.').max(2000),
  interventions: z
    .string()
    .trim()
    .min(5, 'Rencana intervensi wajib diisi minimal 5 karakter.')
    .max(4000),
  reviewIntervalText: z.string().trim().max(200).optional(),
  reviewAt: z.string().optional(),
  precautions: z.string().trim().max(1000).optional(),
  patientVisible: z.boolean(),
  status: z.enum(['DRAFT', 'ACTIVE']),
});

export type SaveTreatmentPlanResult = { ok: true; id: string } | { ok: false; error: string };

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveTreatmentPlan(input: unknown): Promise<SaveTreatmentPlanResult> {
  try {
    const data = treatmentPlanSchema.parse(input);
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ) || role === 'USER') {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola rencana terapi.' };
    }

    const db = getDb();
    const [patient] = await db
      .select({ id: patients.id, userId: patients.userId })
      .from(patients)
      .where(eq(patients.id, data.patientId))
      .limit(1);
    if (!patient) return { ok: false, error: 'Pasien tidak ditemukan.' };

    if (role === 'THERAPIST') {
      const [assignment] = await db
        .select({ id: patientAssignments.id })
        .from(patientAssignments)
        .where(
          and(
            eq(patientAssignments.patientId, data.patientId),
            eq(patientAssignments.staffUserId, session.user.id),
            isNull(patientAssignments.activeUntil),
          ),
        )
        .limit(1);
      if (!assignment) return { ok: false, error: 'Anda tidak memiliki akses ke pasien ini.' };
    }

    const [existing] = await db
      .select({ id: treatmentPlans.id, activatedAt: treatmentPlans.activatedAt })
      .from(treatmentPlans)
      .where(eq(treatmentPlans.patientId, data.patientId))
      .orderBy(desc(treatmentPlans.updatedAt))
      .limit(1);

    const now = new Date();
    const values = {
      goals: data.goals,
      interventions: data.interventions,
      reviewIntervalText: data.reviewIntervalText?.trim() || null,
      reviewAt: parseDate(data.reviewAt),
      precautions: data.precautions?.trim() || null,
      patientVisible: data.patientVisible ? 1 : 0,
      status: data.status,
      activatedAt:
        data.status === 'ACTIVE' ? existing?.activatedAt ?? now : null,
      updatedAt: now,
    };

    let planId = existing?.id;
    if (planId) {
      await db.update(treatmentPlans).set(values).where(eq(treatmentPlans.id, planId));
    } else {
      const [created] = await db
        .insert(treatmentPlans)
        .values({
          patientId: data.patientId,
          createdBy: session.user.id,
          ...values,
        })
        .returning({ id: treatmentPlans.id });
      planId = created.id;
    }

    await createAuditLog({
      action: 'treatment_plan.save',
      targetType: 'treatment_plan',
      targetId: planId,
      meta: {
        patientId: data.patientId,
        status: data.status,
        patientVisible: data.patientVisible,
      },
      userId: session.user.id,
    });

    if (data.status === 'ACTIVE' && data.patientVisible && patient.userId) {
      await notifyUser({
        userId: patient.userId,
        title: 'Rencana terapi diperbarui',
        message: 'Fisioterapis Anda telah memperbarui rencana terapi yang dapat Anda lihat di halaman Rekam Medis.',
        actionUrl: '/dashboard/progress',
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/progress');
    revalidatePath('/dashboard/notifications');
    revalidatePath(`/dashboard/patients/${data.patientId}`);
    return { ok: true, id: planId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? 'Data rencana terapi tidak valid.' };
    }
    return { ok: false, error: 'Rencana terapi tidak dapat disimpan. Coba lagi.' };
  }
}
