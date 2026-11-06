'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

const assignSchema = z.object({
  patientId: z.string().uuid(),
  therapistUserId: z.string().uuid(),
});

export type AssignTherapistResult = { ok: true } | { ok: false; error: string };

/**
 * Assigns (or replaces) the primary therapist of a patient. The previous active
 * primary assignment is closed by setting activeUntil, preserving assignment
 * history instead of deleting it.
 */
export async function assignPatientTherapist(input: unknown): Promise<AssignTherapistResult> {
  try {
    const { patientId, therapistUserId } = assignSchema.parse(input);
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PATIENT_ASSIGN)) {
      return { ok: false, error: 'Anda tidak memiliki izin menetapkan terapis.' };
    }

    const db = getDb();
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);
    if (!patient) return { ok: false, error: 'Pasien tidak ditemukan.' };

    const [therapist] = await db
      .select({ id: users.id, accountType: profiles.accountType, suspendedAt: users.suspendedAt })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, therapistUserId))
      .limit(1);
    if (!therapist || therapist.accountType !== 'THERAPIST') {
      return { ok: false, error: 'Terapis tidak ditemukan atau bukan akun terapis.' };
    }
    if (therapist.suspendedAt) {
      return { ok: false, error: 'Terapis sedang ditangguhkan dan tidak dapat di-assign.' };
    }

    const currentAssignments = await db
      .select({ id: patientAssignments.id, staffUserId: patientAssignments.staffUserId })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, patientId),
          eq(patientAssignments.assignmentType, 'PRIMARY_THERAPIST'),
          isNull(patientAssignments.activeUntil),
        ),
      );

    const alreadyAssigned =
      currentAssignments.length === 1 && currentAssignments[0]?.staffUserId === therapistUserId;
    if (alreadyAssigned) {
      return { ok: true };
    }

    const now = new Date();
    if (currentAssignments.length > 0) {
      await db
        .update(patientAssignments)
        .set({ activeUntil: now })
        .where(
          and(
            eq(patientAssignments.patientId, patientId),
            eq(patientAssignments.assignmentType, 'PRIMARY_THERAPIST'),
            isNull(patientAssignments.activeUntil),
          ),
        );
    }

    await db
      .insert(patientAssignments)
      .values({
        patientId,
        staffUserId: therapistUserId,
        assignmentType: 'PRIMARY_THERAPIST',
        createdBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [
          patientAssignments.patientId,
          patientAssignments.staffUserId,
          patientAssignments.assignmentType,
        ],
        set: {
          activeUntil: null,
          activeFrom: now,
          createdBy: session.user.id,
        },
      });

    await createAuditLog({
      action: 'patient.assign',
      targetType: 'patient',
      targetId: patientId,
      meta: {
        previousTherapistIds: currentAssignments.map((row) => row.staffUserId),
        therapistUserId,
      },
      userId: session.user.id,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}`);
    revalidatePath('/dashboard/appointments');
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? 'Data tidak valid.' };
    }
    if (error instanceof ForbiddenError) {
      return { ok: false, error: 'Anda tidak memiliki izin menetapkan terapis.' };
    }
    return { ok: false, error: 'Terapis tidak dapat ditetapkan. Coba lagi.' };
  }
}
