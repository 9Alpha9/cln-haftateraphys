import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientIntakes, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions/constants';

/**
 * Lightweight count query for the sidebar badge.
 * Returns the number of intakes with status SUBMITTED or UNDER_REVIEW.
 * Caller is responsible for ensuring the current session has the right role.
 */
export async function getPendingIntakeCount(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(patientIntakes)
    .where(inArray(patientIntakes.status, ['SUBMITTED', 'UNDER_REVIEW']));
  return row?.value ?? 0;
}

export async function getReviewableIntakes(page = 1, pageSize = 10, search = '', status = '') {
  const { role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.INTAKE_READ) || role === 'USER') throw new ForbiddenError();

  const allowedStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'ACCEPTED', 'ARCHIVED'] as const;
  const filters = [inArray(patientIntakes.status, allowedStatuses)];
  if (search.trim()) filters.push(ilike(patients.fullName, `%${search.trim()}%`));
  if (allowedStatuses.includes(status as (typeof allowedStatuses)[number]))
    filters.push(eq(patientIntakes.status, status as (typeof allowedStatuses)[number]));
  const where = and(...filters);
  const db = getDb();
  const [total] = await db
    .select({ value: count() })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(where);
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const items = await db
    .select({
      id: patientIntakes.id,
      patientId: patients.id,
      patientName: patients.fullName,
      status: patientIntakes.status,
      affectedArea: patientIntakes.affectedArea,
      submittedAt: patientIntakes.submittedAt,
      updatedAt: patientIntakes.updatedAt,
    })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(where)
    .orderBy(desc(patientIntakes.updatedAt))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return { items, currentPage, totalPages, total: total.value };
}

export async function getScopedIntakeForReview(patientId: string) {
  const { role } = await requireSession({ redirectToLogin: true });
  if (role === 'USER' || !hasPermission(role, PERMISSIONS.INTAKE_READ)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [intake] = await db
    .select({
      id: patientIntakes.id,
      patientId: patientIntakes.patientId,
      patientName: patients.fullName,
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
      reviewMessage: patientIntakes.reviewMessage,
      submittedAt: patientIntakes.submittedAt,
    })
    .from(patientIntakes)
    .innerJoin(patients, eq(patientIntakes.patientId, patients.id))
    .where(eq(patientIntakes.patientId, patientId))
    .orderBy(desc(patientIntakes.version))
    .limit(1);

  return intake ?? null;
}
