import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, therapyProgressRecords, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export type TherapyProgressView = {
  id: string;
  patientId: string;
  patientName: string;
  therapistName: string | null;
  recordedAt: Date;
  painScore: number;
  rangeOfMotionScore: number;
  strengthScore: number;
  functionScore: number;
  anamnesis: string | null;
  physicalExamination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  followUpPlan: string | null;
  summary: string | null;
  status: 'DRAFT' | 'FINALIZED';
  patientVisible: boolean;
};

export type TherapyProgressDetail = TherapyProgressView & {
  patientDob: Date | null;
  patientPhone: string | null;
  patientAddress: string | null;
};

export async function getTherapyProgressById(id: string): Promise<TherapyProgressDetail | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const permission = role === 'USER' ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ;
  if (!hasPermission(role, permission)) throw new ForbiddenError();

  const db = getDb();
  const [row] = await db
    .select({
      id: therapyProgressRecords.id,
      patientId: therapyProgressRecords.patientId,
      patientUserId: patients.userId,
      therapistId: therapyProgressRecords.therapistId,
      patientName: patients.fullName,
      patientDob: patients.dateOfBirth,
      patientPhone: profiles.phone,
      patientAddress: patients.addressLine,
      therapistName: users.name,
      recordedAt: therapyProgressRecords.recordedAt,
      painScore: therapyProgressRecords.painScore,
      rangeOfMotionScore: therapyProgressRecords.rangeOfMotionScore,
      strengthScore: therapyProgressRecords.strengthScore,
      functionScore: therapyProgressRecords.functionScore,
      anamnesis: therapyProgressRecords.anamnesis,
      physicalExamination: therapyProgressRecords.physicalExamination,
      diagnosis: therapyProgressRecords.diagnosis,
      treatment: therapyProgressRecords.treatment,
      followUpPlan: therapyProgressRecords.followUpPlan,
      summary: therapyProgressRecords.summary,
      status: therapyProgressRecords.status,
      patientVisible: therapyProgressRecords.patientVisible,
    })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .where(eq(therapyProgressRecords.id, id))
    .limit(1);

  if (!row) return null;

  if (
    role === 'USER' &&
    (row.patientUserId !== session.user.id || row.status !== 'FINALIZED' || row.patientVisible !== 1)
  ) {
    return null;
  }

  if (role === 'THERAPIST' && row.therapistId !== session.user.id) {
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, row.patientId),
          eq(patientAssignments.staffUserId, session.user.id),
        ),
      )
      .limit(1);

    if (!assignment) return null;
  }

  const { patientUserId: _, therapistId: __, ...record } = row;
  return {
    ...record,
    patientVisible: record.patientVisible === 1,
  };
}

export type PatientMedicalRecordSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  medicalRecordNumber: string | null;
  dateOfBirth: Date | null;
  addressCity: string | null;
  addressProvince: string | null;
  addressLine: string | null;
  caseStatus: string;
  therapyGoal: string | null;
  therapyDiagnosisLabel: string | null;
  therapyFrequencyText: string | null;
  nextTherapyAt: Date | null;
  therapistNote: string | null;
  therapistNoteAuthor: string | null;
  therapistNoteAt: Date | null;
  therapistName: string | null;
  preferredName: string | null;
  occupation: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  avatarKey: string | null;
};

export async function getOwnMedicalRecordSummary(): Promise<PatientMedicalRecordSummary | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.PROGRESS_READ_OWN)) return null;

  const db = getDb();
  const [patient] = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      email: users.email,
      phone: profiles.phone,
      gender: patients.gender,
      medicalRecordNumber: patients.medicalRecordNumber,
      dateOfBirth: patients.dateOfBirth,
      addressCity: patients.addressCity,
      addressProvince: patients.addressProvince,
      addressLine: patients.addressLine,
      caseStatus: patients.caseStatus,
      therapyGoal: patients.therapyGoal,
      therapyDiagnosisLabel: patients.therapyDiagnosisLabel,
      therapyFrequencyText: patients.therapyFrequencyText,
      nextTherapyAt: patients.nextTherapyAt,
      therapistNote: patients.therapistNote,
      therapistNoteAuthor: patients.therapistNoteAuthor,
      therapistNoteAt: patients.therapistNoteAt,
      preferredName: profiles.displayName,
      occupation: patients.occupation,
      emergencyContactName: patients.emergencyContactName,
      emergencyContactRelationship: patients.emergencyContactRelationship,
      emergencyContactPhone: patients.emergencyContactPhone,
      avatarKey: profiles.avatarKey,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  if (!patient) return null;

  const [assignment] = await db
    .select({ therapistName: users.name })
    .from(patientAssignments)
    .innerJoin(users, eq(patientAssignments.staffUserId, users.id))
    .where(eq(patientAssignments.patientId, patient.id))
    .limit(1);

  return { ...patient, therapistName: assignment?.therapistName ?? null };
}

export type GetProgressOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'DRAFT' | 'FINALIZED' | '';
  patientVisible?: boolean | '';
  patientId?: string;
};

export async function getScopedTherapyProgress(
  options: GetProgressOptions = {}
): Promise<{ items: TherapyProgressView[]; total: number; currentPage: number; totalPages: number }> {
  const { page = 1, pageSize = 10, search = '', status = '', patientVisible = '', patientId } = options;

  const { session, role } = await requireSession({ redirectToLogin: true });
  const permission = role === 'USER' ? PERMISSIONS.PROGRESS_READ_OWN : PERMISSIONS.PROGRESS_READ;
  if (!hasPermission(role, permission)) throw new ForbiddenError();

  const db = getDb();
  const isPatient = role === 'USER';

  const baseQuery = db
    .selectDistinct({
      id: therapyProgressRecords.id,
      patientId: therapyProgressRecords.patientId,
      patientName: patients.fullName,
      therapistName: users.name,
      recordedAt: therapyProgressRecords.recordedAt,
      painScore: therapyProgressRecords.painScore,
      rangeOfMotionScore: therapyProgressRecords.rangeOfMotionScore,
      strengthScore: therapyProgressRecords.strengthScore,
      functionScore: therapyProgressRecords.functionScore,
      anamnesis: therapyProgressRecords.anamnesis,
      physicalExamination: therapyProgressRecords.physicalExamination,
      diagnosis: therapyProgressRecords.diagnosis,
      treatment: therapyProgressRecords.treatment,
      followUpPlan: therapyProgressRecords.followUpPlan,
      summary: therapyProgressRecords.summary,
      status: therapyProgressRecords.status,
      patientVisible: therapyProgressRecords.patientVisible,
    })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(patientAssignments, eq(patientAssignments.patientId, patients.id));

  let scopeFilter;

  if (isPatient) {
    scopeFilter = eq(patients.userId, session.user.id);
  } else if (role === 'THERAPIST') {
    scopeFilter = or(
      eq(therapyProgressRecords.therapistId, session.user.id),
      eq(patientAssignments.staffUserId, session.user.id),
    );
  }

  const filters = [scopeFilter];
  if (isPatient) {
    filters.push(eq(therapyProgressRecords.status, 'FINALIZED'));
    filters.push(eq(therapyProgressRecords.patientVisible, 1));
  } else {
    if (status) filters.push(eq(therapyProgressRecords.status, status));
    if (patientVisible !== '') filters.push(eq(therapyProgressRecords.patientVisible, patientVisible ? 1 : 0));
  }
  if (patientId) filters.push(eq(therapyProgressRecords.patientId, patientId));
  if (search.trim()) {
    filters.push(ilike(patients.fullName, `%${search.trim()}%`));
  }

  const whereClause = and(...filters);

  const currentPage = Math.max(1, page);
  const limit = pageSize;

  const [totalResult] = await db
    .select({ value: count() })
    .from(therapyProgressRecords)
    .innerJoin(patients, eq(therapyProgressRecords.patientId, patients.id))
    .innerJoin(users, eq(therapyProgressRecords.therapistId, users.id))
    .leftJoin(patientAssignments, eq(patientAssignments.patientId, patients.id))
    .where(whereClause);

  const total = totalResult.value;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(currentPage, totalPages);

  const rows = await baseQuery
    .where(whereClause)
    .orderBy(desc(therapyProgressRecords.recordedAt))
    .limit(limit)
    .offset((safePage - 1) * limit);

  return {
    items: rows.map((row) => ({ ...row, patientVisible: row.patientVisible === 1 })),
    total,
    currentPage: safePage,
    totalPages,
  };
}