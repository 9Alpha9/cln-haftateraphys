import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientIntakes, patients } from '@/db/schema';

export async function getCurrentPatientIntake(userId: string) {
  const db = getDb();
  const [intake] = await db
    .select({
      status: patientIntakes.status,
      chiefComplaint: patientIntakes.chiefComplaint,
      affectedArea: patientIntakes.affectedArea,
      onsetDescription: patientIntakes.onsetDescription,
      triggeringEvent: patientIntakes.triggeringEvent,
      aggravatingFactors: patientIntakes.aggravatingFactors,
      relievingFactors: patientIntakes.relievingFactors,
      dailyLimitations: patientIntakes.dailyLimitations,
      previousInjuryHistory: patientIntakes.previousInjuryHistory,
      surgeryHistory: patientIntakes.surgeryHistory,
      relevantMedicalHistory: patientIntakes.relevantMedicalHistory,
      currentMedication: patientIntakes.currentMedication,
      allergies: patientIntakes.allergies,
      patientGoal: patientIntakes.patientGoal,
      dataAccuracyAcknowledged: patientIntakes.dataAccuracyAcknowledged,
    })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(eq(patients.userId, userId))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  return intake ?? null;
}

export async function getPatientVisibleIntakeHistory(userId: string) {
  const db = getDb();
  return db
    .select({
      id: patientIntakes.id,
      status: patientIntakes.status,
      affectedArea: patientIntakes.affectedArea,
      submittedAt: patientIntakes.submittedAt,
      updatedAt: patientIntakes.updatedAt,
    })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(
      and(
        eq(patients.userId, userId),
        inArray(patientIntakes.status, ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'ACCEPTED', 'ARCHIVED']),
      ),
    )
    .orderBy(desc(patientIntakes.updatedAt));
}
