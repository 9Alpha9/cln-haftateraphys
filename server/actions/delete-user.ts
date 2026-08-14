'use server';

import { eq, inArray, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  appointmentNotificationReads,
  appointments,
  homeProgramItems,
  homePrograms,
  internalCalendarEvents,
  patientAssignments,
  patientIntakes,
  patients,
  profiles,
  users,
} from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { recordAudit } from '@/server/audit';

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export type DeleteUserResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Permanently deletes a user account and all of its data (patient records,
 * appointments, intakes, home programs, assignments, etc.) inside a single
 * transaction. Guarded to SUPER_ADMIN only, never self, never the last super
 * admin. Destructive and irreversible.
 */
export async function deleteUser(input: unknown): Promise<DeleteUserResult> {
  try {
    const { userId } = deleteUserSchema.parse(input);
    const { session, role: actorRole } = await requireSession({
      redirectToLogin: false,
    });

    if (actorRole !== 'SUPER_ADMIN' || !hasPermission(actorRole, PERMISSIONS.USER_SUSPEND)) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk menghapus akun.' };
    }

    if (userId === session.user.id) {
      return { ok: false, error: 'Anda tidak dapat menghapus akun sendiri.' };
    }

    const db = getDb();

    const [target] = await db
      .select({ id: users.id, email: users.email, accountType: profiles.accountType })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) {
      return { ok: false, error: 'Pengguna tidak ditemukan.' };
    }

    if (target.accountType === 'SUPER_ADMIN') {
      const [superAdmins] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.accountType, 'SUPER_ADMIN'));
      if ((superAdmins?.count ?? 0) <= 1) {
        return { ok: false, error: 'Tidak dapat menghapus Super Admin terakhir.' };
      }
    }

    await db.transaction(async (tx) => {
      const patientRows = await tx
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, userId));
      const patientIds = patientRows.map((p) => p.id);

      let apptIds: string[] = [];
      if (patientIds.length > 0) {
        const appts = await tx
          .select({ id: appointments.id })
          .from(appointments)
          .where(inArray(appointments.patientId, patientIds));
        apptIds = appts.map((a) => a.id);
      }

      const targetAppts = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(or(eq(appointments.therapistId, userId), eq(appointments.createdBy, userId)));
      apptIds = [...new Set([...apptIds, ...targetAppts.map((a) => a.id)])];

      let programIds: string[] = [];
      if (patientIds.length > 0) {
        const progs = await tx
          .select({ id: homePrograms.id })
          .from(homePrograms)
          .where(inArray(homePrograms.patientId, patientIds));
        programIds = progs.map((p) => p.id);
      }

      const targetPrograms = await tx
        .select({ id: homePrograms.id })
        .from(homePrograms)
        .where(eq(homePrograms.createdBy, userId));
      programIds = [...new Set([...programIds, ...targetPrograms.map((p) => p.id)])];

      const never = eq(users.id, sql`'00000000-0000-0000-0000-000000000000'`);

      if (apptIds.length > 0) {
        await tx
          .delete(appointmentNotificationReads)
          .where(
            or(
              eq(appointmentNotificationReads.userId, userId),
              inArray(appointmentNotificationReads.appointmentId, apptIds),
            ),
          );
      } else {
        await tx
          .delete(appointmentNotificationReads)
          .where(eq(appointmentNotificationReads.userId, userId));
      }

      if (apptIds.length > 0) {
        await tx
          .update(appointments)
          .set({ rescheduledFromId: null })
          .where(inArray(appointments.rescheduledFromId, apptIds));
      }

      await tx
        .delete(appointments)
        .where(
          or(
            patientIds.length > 0 ? inArray(appointments.patientId, patientIds) : never,
            eq(appointments.therapistId, userId),
            eq(appointments.createdBy, userId),
          ),
        );

      if (patientIds.length > 0) {
        await tx.delete(patientIntakes).where(inArray(patientIntakes.patientId, patientIds));
        await tx.delete(patientAssignments).where(inArray(patientAssignments.patientId, patientIds));
      }
      await tx
        .delete(patientAssignments)
        .where(
          or(
            eq(patientAssignments.staffUserId, userId),
            eq(patientAssignments.createdBy, userId),
          ),
        );

      if (programIds.length > 0) {
        await tx.delete(homeProgramItems).where(inArray(homeProgramItems.homeProgramId, programIds));
        await tx
          .delete(homePrograms)
          .where(
            or(
              inArray(homePrograms.id, programIds),
              eq(homePrograms.createdBy, userId),
            ),
          );
      } else {
        await tx.delete(homePrograms).where(eq(homePrograms.createdBy, userId));
      }

      if (patientIds.length > 0) {
        await tx.delete(patients).where(inArray(patients.id, patientIds));
      }

      await tx
        .update(patientIntakes)
        .set({ reviewedBy: null })
        .where(eq(patientIntakes.reviewedBy, userId));

      await tx
        .delete(internalCalendarEvents)
        .where(eq(internalCalendarEvents.createdBy, userId));

      await tx.delete(users).where(eq(users.id, userId));
    });

    await recordAudit('user.delete', {
      targetType: 'user',
      targetId: userId,
      meta: { actorRole, deletedEmail: target.email, deletedAccountType: target.accountType },
    });

    revalidatePath('/dashboard/users');
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Data tidak valid.' };
    }
    return { ok: false, error: 'Gagal menghapus akun. Periksa apakah ada data terkait yang memblokir.' };
  }
}
