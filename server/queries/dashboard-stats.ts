import { and, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patientAssignments, patientIntakes, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export type DashboardStats = {
  kpis: {
    totalAppointments: number;
    activePatients: number;
    submittedIntakes: number;
    completedCases: number;
  };
  patientsByStatus: { status: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  appointmentsTrend: { day: string; count: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const db = getDb();

  const isTherapist = role === 'THERAPIST';
  const canSeeAll = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'THERAPIST';

  const notAllowed = {
    kpis: { totalAppointments: 0, activePatients: 0, submittedIntakes: 0, completedCases: 0 },
    patientsByStatus: [],
    appointmentsByStatus: [],
    appointmentsTrend: [],
  };
  if (!canSeeAll || !hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) {
    return notAllowed;
  }

  const patientWhere = isTherapist ? eq(patientAssignments.staffUserId, session.user.id) : null;

  let patientsByStatusRows: DashboardStats['patientsByStatus'] = [];

  if (isTherapist) {
    patientsByStatusRows = await db
      .select({
        status: patients.caseStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(patients)
      .innerJoin(patientAssignments, eq(patientAssignments.patientId, patients.id))
      .where(eq(patientAssignments.staffUserId, session.user.id))
      .groupBy(patients.caseStatus);
  } else {
    patientsByStatusRows = await db
      .select({
        status: patients.caseStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(patients)
      .groupBy(patients.caseStatus);
  }

  const appointmentWhere = isTherapist ? eq(appointments.therapistId, session.user.id) : undefined;

  const appointmentsByStatusRows = await db
    .select({
      status: appointments.status,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(appointmentWhere)
    .groupBy(appointments.status);

  const [kpiRows] = await db
    .select({
      totalAppointments: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(appointmentWhere);

  const [submittedIntakes] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(patientIntakes)
    .where(sql`${patientIntakes.status} in ('SUBMITTED','UNDER_REVIEW')`);

  const [completedCases] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(patients)
    .where(eq(patients.caseStatus, 'COMPLETED'));

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  let trend: DashboardStats['appointmentsTrend'] = [];
  const trendRows = await db
    .select({
      day: sql<string>`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(
      and(appointmentWhere ?? sql`true`, gte(appointments.scheduledDate, fourteenDaysAgo.toISOString().slice(0, 10))),
    )
    .groupBy(sql`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`);

  const trendMap = new Map(trendRows.map((row) => [row.day, row.count]));
  const dayFmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' });
  for (let i = 13; i >= 0; i--) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(fourteenDaysAgo.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    trend.push({ day: dayFmt.format(d), count: trendMap.get(key) ?? 0 });
  }

  return {
    kpis: {
      totalAppointments: kpiRows?.totalAppointments ?? 0,
      activePatients: patientsByStatusRows.filter((r) => r.status === 'ACTIVE').reduce((s, r) => s + r.count, 0),
      submittedIntakes: submittedIntakes?.count ?? 0,
      completedCases: completedCases?.count ?? 0,
    },
    patientsByStatus: patientsByStatusRows,
    appointmentsByStatus: appointmentsByStatusRows,
    appointmentsTrend: trend,
  };
}
