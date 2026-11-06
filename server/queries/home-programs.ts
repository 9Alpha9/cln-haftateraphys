import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { homeProgramItems, homePrograms, patientAssignments, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export type HomeProgramItemView = {
  id: string;
  name: string;
  instruction: string;
  sets: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  frequencyText: string | null;
  precaution: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
};

export type HomeProgramView = {
  id: string;
  patientId: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startsAt: Date | null;
  endsAt: Date | null;
  patientVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: HomeProgramItemView[];
};

async function loadProgram(patientId: string, patientView: boolean): Promise<HomeProgramView | null> {
  const db = getDb();
  const [program] = await db
    .select({
      id: homePrograms.id,
      patientId: homePrograms.patientId,
      status: homePrograms.status,
      startsAt: homePrograms.startsAt,
      endsAt: homePrograms.endsAt,
      patientVisible: homePrograms.patientVisible,
      createdAt: homePrograms.createdAt,
      updatedAt: homePrograms.updatedAt,
    })
    .from(homePrograms)
    .where(
      patientView
        ? and(
            eq(homePrograms.patientId, patientId),
            eq(homePrograms.status, 'ACTIVE'),
            eq(homePrograms.patientVisible, 1),
          )
        : eq(homePrograms.patientId, patientId),
    )
    .orderBy(desc(homePrograms.updatedAt))
    .limit(1);

  if (!program) return null;

  const items = await db
    .select({
      id: homeProgramItems.id,
      name: homeProgramItems.name,
      instruction: homeProgramItems.instruction,
      sets: homeProgramItems.sets,
      repetitions: homeProgramItems.repetitions,
      durationSeconds: homeProgramItems.durationSeconds,
      frequencyText: homeProgramItems.frequencyText,
      precaution: homeProgramItems.precaution,
      status: homeProgramItems.status,
    })
    .from(homeProgramItems)
    .where(
      patientView
        ? and(
            eq(homeProgramItems.homeProgramId, program.id),
            eq(homeProgramItems.status, 'ACTIVE'),
          )
        : eq(homeProgramItems.homeProgramId, program.id),
    )
    .orderBy(asc(homeProgramItems.sortOrder));

  return {
    ...program,
    patientVisible: program.patientVisible === 1,
    items,
  };
}

export async function getHomeProgramForPatient(patientId: string): Promise<HomeProgramView | null> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) return null;

  if (role === 'THERAPIST') {
    const [assignment] = await getDb()
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);
    if (!assignment) return null;
  }

  return loadProgram(patientId, false);
}

export async function getOwnHomeProgram(): Promise<HomeProgramView | null> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.PROGRESS_READ_OWN)) return null;

  const [patient] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  if (!patient) return null;
  return loadProgram(patient.id, true);
}
