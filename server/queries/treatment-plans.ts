import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientAssignments, patients, treatmentPlans } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export type TreatmentPlanView = {
  id: string;
  patientId: string;
  goals: string;
  interventions: string;
  reviewIntervalText: string | null;
  reviewAt: Date | null;
  precautions: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  patientVisible: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

async function loadPlan(patientId: string, patientView: boolean): Promise<TreatmentPlanView | null> {
  const db = getDb();
  const [plan] = await db
    .select({
      id: treatmentPlans.id,
      patientId: treatmentPlans.patientId,
      goals: treatmentPlans.goals,
      interventions: treatmentPlans.interventions,
      reviewIntervalText: treatmentPlans.reviewIntervalText,
      reviewAt: treatmentPlans.reviewAt,
      precautions: treatmentPlans.precautions,
      status: treatmentPlans.status,
      patientVisible: treatmentPlans.patientVisible,
      activatedAt: treatmentPlans.activatedAt,
      createdAt: treatmentPlans.createdAt,
      updatedAt: treatmentPlans.updatedAt,
    })
    .from(treatmentPlans)
    .where(
      patientView
        ? and(
            eq(treatmentPlans.patientId, patientId),
            eq(treatmentPlans.status, 'ACTIVE'),
            eq(treatmentPlans.patientVisible, 1),
          )
        : eq(treatmentPlans.patientId, patientId),
    )
    .orderBy(desc(treatmentPlans.updatedAt))
    .limit(1);

  if (!plan) return null;
  return { ...plan, patientVisible: plan.patientVisible === 1 };
}

export async function getTreatmentPlanForPatient(
  patientId: string,
): Promise<TreatmentPlanView | null> {
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

  return loadPlan(patientId, false);
}

export async function getOwnTreatmentPlan(): Promise<TreatmentPlanView | null> {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.PROGRESS_READ_OWN)) return null;

  const [patient] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);
  if (!patient) return null;

  return loadPlan(patient.id, true);
}
