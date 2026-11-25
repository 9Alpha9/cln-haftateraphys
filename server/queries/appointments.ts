import { and, asc, count, desc, eq, ilike, inArray, isNull, lte, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients, patientAssignments, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { isNoShowDue, localDateKey } from '@/server/appointment-status';
import { syncNextTherapyAt } from '@/server/queries/next-therapy-sync';

export type AppointmentView = {
  id: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  patientName: string;
  patientImage: string | null;
  therapistName: string | null;
  isNew: boolean;
};

export type AppointmentDetail = {
  id: string;
  patientId: string;
  therapistId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  administrativeNote: string | null;
  patientName: string;
  patientImage: string | null;
  therapistName: string | null;
};

export async function getAppointmentById(appointmentId: string): Promise<AppointmentDetail | null> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) throw new ForbiddenError();

  const db = getDb();
  const [appointment] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      therapistId: appointments.therapistId,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
      status: appointments.status,
      administrativeNote: appointments.administrativeNote,
      patientName: patients.fullName,
      patientImage: profiles.avatarKey,
      therapistName: users.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .where(
      role === 'THERAPIST'
        ? and(eq(appointments.id, appointmentId), eq(appointments.therapistId, session.user.id))
        : eq(appointments.id, appointmentId),
    )
    .limit(1);

  return appointment ?? null;
}

let lastNoShowSweepAt = 0;

/**
 * Sweep NO_SHOW otomatis: sesi berstatus SCHEDULED/CONFIRMED yang melewati
 * jam mulai + 24 jam tanpa penyelesaian ditandai `NO_SHOW` (mangkir), dan
 * kartu "Berikutnya" portal pasien ikut diselaraskan.
 *
 * Dibatasi maksimal sekali per 60 detik per proses agar beban query ringan;
 * kegagalan sweep tidak menghalangi pembacaan jadwal (dicoba lagi nanti).
 */
export async function expireMissedAppointments(): Promise<void> {
  const now = Date.now();
  if (now - lastNoShowSweepAt < 60_000) return;
  lastNoShowSweepAt = now;
  try {
    const db = getDb();
    const candidates = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        scheduledDate: appointments.scheduledDate,
        startTime: appointments.startTime,
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.status, ['SCHEDULED', 'CONFIRMED']),
          lte(appointments.scheduledDate, localDateKey(new Date(now))),
        ),
      );
    const expired = candidates.filter((row) => isNoShowDue(row.scheduledDate, row.startTime, new Date(now)));
    if (expired.length === 0) return;
    await db
      .update(appointments)
      .set({ status: 'NO_SHOW', updatedAt: new Date(now) })
      .where(inArray(appointments.id, expired.map((row) => row.id)));
    for (const patientId of new Set(expired.map((row) => row.patientId))) {
      await syncNextTherapyAt(patientId);
    }
  } catch {
    // Sweep bersifat non-kritis: bila gagal, pembacaan jadwal tetap jalan
    // dan percobaan berikutnya dilakukan setelah jeda 60 detik.
  }
}

export async function getScopedAppointments(
  page = 1,
  pageSize = 6,
  activeStatus:
    | 'ALL'
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'RESCHEDULED'
    | 'NO_SHOW' = 'ALL',
  query: string = '',
) {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();

  await expireMissedAppointments();

  const db = getDb();
  const baseWhere =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'THERAPIST'
        ? eq(appointments.therapistId, session.user.id)
        : undefined;

  // statusCounts from base scope (unfiltered) so tabs show full counts
  const statusRows = await db
    .select({ status: appointments.status, value: count() })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(baseWhere)
    .groupBy(appointments.status);
  const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.value);
    return acc;
  }, {});

  // Build filtered where clause
  const filters: (ReturnType<typeof eq> | ReturnType<typeof ilike> | ReturnType<typeof or>)[] = [];
  if (baseWhere) filters.push(baseWhere);
  if (activeStatus && activeStatus !== 'ALL') {
    filters.push(
      eq(
        appointments.status,
        activeStatus as 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW',
      ),
    );
  }
  const q = query.trim();
  if (q) {
    const like = `%${q}%`;
    filters.push(
      or(
        ilike(patients.fullName, like),
        ilike(appointments.type, like),
        ilike(users.name, like),
      )!,
    );
  }
  const filteredWhere = filters.length > 0 ? and(...filters) : undefined;

  const [totalRows] = await db
    .select({ value: count() })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(filteredWhere);
  const total = Number(totalRows?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const rawItems = await db
    .select({
      id: appointments.id,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
      status: appointments.status,
      patientName: patients.fullName,
      patientImage: profiles.avatarKey,
      therapistName: users.name,
      readId: appointmentNotificationReads.id,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .leftJoin(
      appointmentNotificationReads,
      and(
        eq(appointmentNotificationReads.appointmentId, appointments.id),
        eq(appointmentNotificationReads.userId, session.user.id)
      )
    )
    .where(filteredWhere)
    .orderBy(desc(appointments.scheduledDate), asc(appointments.startTime))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const items: AppointmentView[] = rawItems.map(({ readId, ...appointment }) => ({
    ...appointment,
    isNew: readId === null,
  }));

  return { items, currentPage, totalPages, total, statusCounts };
}

export async function assertPatientSchedulingScope(patientId: string) {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role === 'USER' || !hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE)) {
    throw new ForbiddenError();
  }

  const [patient] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.id, patientId), isNull(patients.archivedAt)))
    .limit(1);

  if (!patient) throw new ForbiddenError();

  // THERAPIST must have an active assignment to the patient (AGENTS.md §5 clinical scope)
  if (role === 'THERAPIST') {
    const [assignment] = await getDb()
      .select({ id: patientAssignments.patientId })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, patientId),
          eq(patientAssignments.staffUserId, session.user.id),
          isNull(patientAssignments.activeUntil),
        ),
      )
      .limit(1);
    if (!assignment) throw new ForbiddenError();
  }
}
