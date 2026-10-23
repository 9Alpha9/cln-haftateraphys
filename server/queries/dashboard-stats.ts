import { and, desc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patientAssignments, patientIntakes, patients, therapyProgressRecords } from '@/db/schema';
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
  appointmentsTrend: { day: string; count: number; progressCount?: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  const db = getDb();

  const isTherapist = role === 'THERAPIST';
  const canSeeAll = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'THERAPIST';

  const notAllowed: DashboardStats = {
    kpis: { totalAppointments: 0, activePatients: 0, submittedIntakes: 0, completedCases: 0 },
    patientsByStatus: [],
    appointmentsByStatus: [],
    appointmentsTrend: [],
  };

  if (!canSeeAll || !hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) {
    return notAllowed;
  }

  // Cari ID semua pasien yang terhubung dengan terapis ini (via appointment, therapy record, atau assignment)
  let therapistPatientIds: string[] = [];
  if (isTherapist) {
    const [assigned, apptPatients, progressPatients] = await Promise.all([
      db
        .select({ patientId: patientAssignments.patientId })
        .from(patientAssignments)
        .where(eq(patientAssignments.staffUserId, session.user.id)),
      db
        .select({ patientId: appointments.patientId })
        .from(appointments)
        .where(eq(appointments.therapistId, session.user.id)),
      db
        .select({ patientId: therapyProgressRecords.patientId })
        .from(therapyProgressRecords)
        .where(eq(therapyProgressRecords.therapistId, session.user.id)),
    ]);

    const idSet = new Set<string>();
    assigned.forEach((r) => r.patientId && idSet.add(r.patientId));
    apptPatients.forEach((r) => r.patientId && idSet.add(r.patientId));
    progressPatients.forEach((r) => r.patientId && idSet.add(r.patientId));
    therapistPatientIds = Array.from(idSet);
  }

  // 1. Data Status Pasien
  let patientsByStatusRows: DashboardStats['patientsByStatus'] = [];
  if (isTherapist) {
    if (therapistPatientIds.length > 0) {
      patientsByStatusRows = await db
        .select({
          status: patients.caseStatus,
          count: sql<number>`count(*)::int`,
        })
        .from(patients)
        .where(inArray(patients.id, therapistPatientIds))
        .groupBy(patients.caseStatus);
    } else {
      patientsByStatusRows = [];
    }
  } else {
    patientsByStatusRows = await db
      .select({
        status: patients.caseStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(patients)
      .groupBy(patients.caseStatus);
  }

  // 2. Data Status Janji Temu
  const appointmentWhere = isTherapist ? eq(appointments.therapistId, session.user.id) : undefined;

  const appointmentsByStatusRows = await db
    .select({
      status: appointments.status,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(appointmentWhere)
    .groupBy(appointments.status);

  // 3. KPI Total Appointments
  const [kpiAppts] = await db
    .select({
      totalAppointments: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(appointmentWhere);

  // 4. KPI Intake Menunggu (Global untuk terapis/admin)
  const [submittedIntakes] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(patientIntakes)
    .where(sql`${patientIntakes.status} in ('SUBMITTED','UNDER_REVIEW')`);

  // 5. KPI Selesai (Final progress records atau Completed patients)
  let completedCount = 0;
  if (isTherapist) {
    const [compProgress] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(therapyProgressRecords)
      .where(and(eq(therapyProgressRecords.therapistId, session.user.id), eq(therapyProgressRecords.status, 'FINALIZED')));
    completedCount = compProgress?.count ?? 0;
  } else {
    const [compPatients] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patients)
      .where(eq(patients.caseStatus, 'COMPLETED'));
    completedCount = compPatients?.count ?? 0;
  }

  // 6. Tren Janji Temu & Evaluasi
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [trendRows, progressTrendRows] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .where(
        and(appointmentWhere ?? sql`true`, gte(appointments.scheduledDate, fourteenDaysAgo.toISOString().slice(0, 10)))
      )
      .groupBy(sql`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${appointments.scheduledDate}, 'YYYY-MM-DD')`),
    db
      .select({
        day: sql<string>`to_char(${therapyProgressRecords.recordedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(therapyProgressRecords)
      .where(
        and(
          isTherapist ? eq(therapyProgressRecords.therapistId, session.user.id) : sql`true`,
          gte(therapyProgressRecords.recordedAt, fourteenDaysAgo)
        )
      )
      .groupBy(sql`to_char(${therapyProgressRecords.recordedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${therapyProgressRecords.recordedAt}, 'YYYY-MM-DD')`),
  ]);

  const trendMap = new Map(trendRows.map((row) => [row.day, row.count]));
  const progressMap = new Map(progressTrendRows.map((row) => [row.day, row.count]));
  const dayFmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' });

  const trend: DashboardStats['appointmentsTrend'] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(fourteenDaysAgo.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    trend.push({
      day: dayFmt.format(d),
      count: trendMap.get(key) ?? 0,
      progressCount: progressMap.get(key) ?? 0,
    });
  }

  // Active patients: count total connected patients for therapist, or active patients globally
  const activePatientsCount = isTherapist
    ? therapistPatientIds.length
    : patientsByStatusRows.filter((r) => r.status === 'ACTIVE' || r.status === 'INTAKE').reduce((s, r) => s + r.count, 0);

  return {
    kpis: {
      totalAppointments: kpiAppts?.totalAppointments ?? 0,
      activePatients: activePatientsCount,
      submittedIntakes: submittedIntakes?.count ?? 0,
      completedCases: completedCount,
    },
    patientsByStatus: patientsByStatusRows,
    appointmentsByStatus: appointmentsByStatusRows,
    appointmentsTrend: trend,
  };
}
