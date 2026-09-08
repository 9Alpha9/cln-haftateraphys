import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientIntakes, patients } from '@/db/schema';
import { ForbiddenError } from '@/lib/permissions';

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
      patientName: patients.fullName,
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

export type IntakeHistoryPdfData = {
  id: string;
  status: string;
  affectedArea: string | null;
  submittedAt: Date | null;
  patientName: string;
  medicalRecordNumber: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  chiefComplaint: string | null;
  onsetDescription: string | null;
  triggeringEvent: string | null;
  aggravatingFactors: string | null;
  relievingFactors: string | null;
  dailyLimitations: string | null;
  previousInjuryHistory: string | null;
  surgeryHistory: string | null;
  relevantMedicalHistory: string | null;
  currentMedication: string | null;
  allergies: string | null;
  patientGoal: string | null;
};

export async function getIntakeDetailForPdf(
  intakeId: string,
  userId: string,
  role: string,
): Promise<IntakeHistoryPdfData | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: patientIntakes.id,
      status: patientIntakes.status,
      affectedArea: patientIntakes.affectedArea,
      submittedAt: patientIntakes.submittedAt,
      patientName: patients.fullName,
      medicalRecordNumber: patients.medicalRecordNumber,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      chiefComplaint: patientIntakes.chiefComplaint,
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
      patientUserId: patients.userId,
    })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(eq(patientIntakes.id, intakeId))
    .limit(1);

  if (!row) return null;

  if (role === 'USER' && row.patientUserId !== userId) {
    throw new ForbiddenError();
  }

  const { patientUserId: _, ...data } = row;
  return data;
}
