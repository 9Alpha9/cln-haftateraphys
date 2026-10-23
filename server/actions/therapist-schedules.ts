'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { profiles, therapistSchedules, therapistTimeOff, users } from '@/db/schema';
import { createAuditLog } from '@/lib/audit';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS, type Role } from '@/lib/permissions';
import {
  saveTherapistScheduleSchema,
  therapistTimeOffSchema,
  type TherapistScheduleEntryInput,
} from '@/lib/validators/therapist-availability';
import { isTherapistAllowedForSchedules } from '@/server/queries/therapist-schedules';

async function assertCanManageTherapist(role: Role, userId: string, therapistId: string) {
  if (
    role === 'USER' ||
    (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) &&
      !hasPermission(role, PERMISSIONS.SETTINGS_MANAGE))
  ) {
    throw new ForbiddenError();
  }
  if (!isTherapistAllowedForSchedules(role, therapistId, userId)) {
    throw new ForbiddenError();
  }

  const [therapist] = await getDb()
    .select({ id: users.id })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.id, therapistId), eq(profiles.accountType, 'THERAPIST')))
    .limit(1);
  if (!therapist) throw new Error('Fisioterapis tidak ditemukan.');
}

function revalidateAvailability() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/users');
}

export async function saveTherapistWeeklySchedule(input: {
  therapistId: string;
  entries: TherapistScheduleEntryInput[];
}) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  const data = saveTherapistScheduleSchema.parse(input);
  await assertCanManageTherapist(role, session.user.id, data.therapistId);

  const db = getDb();
  const deleteExisting = db
    .delete(therapistSchedules)
    .where(eq(therapistSchedules.therapistId, data.therapistId));

  if (data.entries.length > 0) {
    await db.batch([
      deleteExisting,
      db.insert(therapistSchedules).values(
        data.entries.map((entry) => ({
          therapistId: data.therapistId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        })),
      ),
    ]);
  } else {
    await deleteExisting;
  }

  await createAuditLog({
    action: 'therapist.schedule.update',
    targetType: 'therapist_schedule',
    targetId: data.therapistId,
    meta: { entries: data.entries },
    userId: session.user.id,
  });

  revalidateAvailability();
  return { ok: true as const };
}

export async function addTherapistTimeOff(input: {
  therapistId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  const data = therapistTimeOffSchema.parse(input);
  await assertCanManageTherapist(role, session.user.id, data.therapistId);

  const [created] = await getDb()
    .insert(therapistTimeOff)
    .values({
      therapistId: data.therapistId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason?.trim() || null,
      createdBy: session.user.id,
    })
    .returning({ id: therapistTimeOff.id });

  await createAuditLog({
    action: 'therapist.time_off.create',
    targetType: 'therapist_time_off',
    targetId: created.id,
    meta: {
      therapistId: data.therapistId,
      startDate: data.startDate,
      endDate: data.endDate,
    },
    userId: session.user.id,
  });

  revalidateAvailability();
  return { ok: true as const };
}

export async function deleteTherapistTimeOff(timeOffId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (
    role === 'USER' ||
    (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) &&
      !hasPermission(role, PERMISSIONS.SETTINGS_MANAGE))
  ) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [item] = await db
    .select({ id: therapistTimeOff.id, therapistId: therapistTimeOff.therapistId })
    .from(therapistTimeOff)
    .where(eq(therapistTimeOff.id, timeOffId))
    .limit(1);
  if (!item) throw new Error('Jadwal cuti tidak ditemukan.');
  if (!isTherapistAllowedForSchedules(role, item.therapistId, session.user.id)) {
    throw new ForbiddenError();
  }

  await db.delete(therapistTimeOff).where(eq(therapistTimeOff.id, timeOffId));

  await createAuditLog({
    action: 'therapist.time_off.delete',
    targetType: 'therapist_time_off',
    targetId: timeOffId,
    meta: { therapistId: item.therapistId },
    userId: session.user.id,
  });

  revalidateAvailability();
  return { ok: true as const };
}
