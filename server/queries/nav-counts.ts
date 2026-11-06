import { and, count, countDistinct, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, therapyProgressRecords } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getPendingIntakeCount } from '@/server/queries/intake-review';

export type DashboardNavCounts = {
  patients: number;
  intake: number;
  progressDrafts: number;
};

const EMPTY_COUNTS: DashboardNavCounts = { patients: 0, intake: 0, progressDrafts: 0 };

/**
 * Lightweight, role-scoped counters for sidebar indicators. Only the three
 * priority counters are computed; zero values are hidden by the shell.
 */
export async function getDashboardNavCounts(): Promise<DashboardNavCounts> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role === 'USER') return EMPTY_COUNTS;

  const db = getDb();

  let patientsCount = 0;
  if (role === 'THERAPIST') {
    const [row] = await db
      .select({ value: countDistinct(patientAssignments.patientId) })
      .from(patientAssignments)
      .innerJoin(patients, eq(patients.id, patientAssignments.patientId))
      .where(
        and(
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
          isNull(patients.archivedAt),
        ),
      );
    patientsCount = row?.value ?? 0;
  } else {
    const [row] = await db
      .select({ value: count() })
      .from(patients)
      .where(isNull(patients.archivedAt));
    patientsCount = row?.value ?? 0;
  }

  const intake = await getPendingIntakeCount();

  let progressDrafts = 0;
  if (hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
    const scope =
      role === 'THERAPIST' ? eq(therapyProgressRecords.therapistId, session.user.id) : undefined;
    const [row] = await db
      .select({ value: count() })
      .from(therapyProgressRecords)
      .where(
        and(
          scope,
          eq(therapyProgressRecords.status, 'DRAFT'),
          isNull(therapyProgressRecords.supersededAt),
        ),
      );
    progressDrafts = row?.value ?? 0;
  }

  return { patients: patientsCount, intake, progressDrafts };
}
