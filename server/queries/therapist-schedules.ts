import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, therapistSchedules, therapistTimeOff, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS, type Role } from '@/lib/permissions';

export type TherapistScheduleBlock = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type TherapistTimeOffView = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type TherapistScheduleOverview = {
  therapistId: string;
  therapistName: string;
  blocks: TherapistScheduleBlock[];
  timeOff: TherapistTimeOffView[];
};

export async function getTherapistScheduleOverview(): Promise<TherapistScheduleOverview[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (
    role === 'USER' ||
    (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE) &&
      !hasPermission(role, PERMISSIONS.SETTINGS_MANAGE))
  ) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const therapistRows = await db
    .select({ therapistId: users.id, therapistName: users.name })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(profiles.accountType, 'THERAPIST'))
    .orderBy(asc(users.name));

  const visibleTherapists =
    role === 'THERAPIST'
      ? therapistRows.filter((therapist) => therapist.therapistId === session.user.id)
      : therapistRows;

  if (visibleTherapists.length === 0) return [];

  const therapistIds = visibleTherapists.map((therapist) => therapist.therapistId);
  const todayKey = new Date().toISOString().slice(0, 10);
  const [blocks, timeOff] = await Promise.all([
    db
      .select({
        id: therapistSchedules.id,
        therapistId: therapistSchedules.therapistId,
        dayOfWeek: therapistSchedules.dayOfWeek,
        startTime: therapistSchedules.startTime,
        endTime: therapistSchedules.endTime,
      })
      .from(therapistSchedules)
      .where(
        and(
          inArray(therapistSchedules.therapistId, therapistIds),
          eq(therapistSchedules.isActive, true),
        ),
      )
      .orderBy(asc(therapistSchedules.dayOfWeek), asc(therapistSchedules.startTime)),
    db
      .select({
        id: therapistTimeOff.id,
        therapistId: therapistTimeOff.therapistId,
        startDate: therapistTimeOff.startDate,
        endDate: therapistTimeOff.endDate,
        reason: therapistTimeOff.reason,
      })
      .from(therapistTimeOff)
      .where(
        and(
          inArray(therapistTimeOff.therapistId, therapistIds),
          gte(therapistTimeOff.endDate, todayKey),
        ),
      )
      .orderBy(asc(therapistTimeOff.startDate)),
  ]);

  return visibleTherapists.map((therapist) => ({
    therapistId: therapist.therapistId,
    therapistName: therapist.therapistName || 'Fisioterapis Hafta',
    blocks: blocks
      .filter((block) => block.therapistId === therapist.therapistId)
      .map(({ id, dayOfWeek, startTime, endTime }) => ({ id, dayOfWeek, startTime, endTime })),
    timeOff: timeOff
      .filter((item) => item.therapistId === therapist.therapistId)
      .map(({ id, startDate, endDate, reason }) => ({ id, startDate, endDate, reason })),
  }));
}

export type AvailabilityRules = {
  blocksByTherapist: Map<string, TherapistScheduleBlock[]>;
  timeOffByTherapist: Map<string, TherapistTimeOffView[]>;
};

export async function getAvailabilityRules(
  therapistIds: string[],
  startKey: string,
  endKey: string,
): Promise<AvailabilityRules> {
  const blocksByTherapist = new Map<string, TherapistScheduleBlock[]>();
  const timeOffByTherapist = new Map<string, TherapistTimeOffView[]>();
  if (therapistIds.length === 0) return { blocksByTherapist, timeOffByTherapist };

  const db = getDb();
  const [blocks, timeOff] = await Promise.all([
    db
      .select({
        id: therapistSchedules.id,
        therapistId: therapistSchedules.therapistId,
        dayOfWeek: therapistSchedules.dayOfWeek,
        startTime: therapistSchedules.startTime,
        endTime: therapistSchedules.endTime,
      })
      .from(therapistSchedules)
      .where(
        and(
          inArray(therapistSchedules.therapistId, therapistIds),
          eq(therapistSchedules.isActive, true),
        ),
      ),
    db
      .select({
        id: therapistTimeOff.id,
        therapistId: therapistTimeOff.therapistId,
        startDate: therapistTimeOff.startDate,
        endDate: therapistTimeOff.endDate,
        reason: therapistTimeOff.reason,
      })
      .from(therapistTimeOff)
      .where(
        and(
          inArray(therapistTimeOff.therapistId, therapistIds),
          lte(therapistTimeOff.startDate, endKey),
          gte(therapistTimeOff.endDate, startKey),
        ),
      ),
  ]);

  for (const block of blocks) {
    const { therapistId, ...rest } = block;
    blocksByTherapist.set(therapistId, [...(blocksByTherapist.get(therapistId) ?? []), rest]);
  }
  for (const item of timeOff) {
    const { therapistId, ...rest } = item;
    timeOffByTherapist.set(therapistId, [...(timeOffByTherapist.get(therapistId) ?? []), rest]);
  }

  return { blocksByTherapist, timeOffByTherapist };
}

export function isTherapistAllowedForSchedules(role: Role, therapistId: string, userId: string) {
  return role !== 'THERAPIST' || therapistId === userId;
}
