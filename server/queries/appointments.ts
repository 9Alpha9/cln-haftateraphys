import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

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

export async function getScopedAppointments(page = 1, pageSize = 6) {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();

  const db = getDb();
  const where =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'SUPER_ADMIN'
        ? eq(appointments.createdBy, session.user.id)
        : eq(appointments.therapistId, session.user.id);
  const [totalRows, statusRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(where),
    db
      .select({ status: appointments.status, value: count() })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(where)
      .groupBy(appointments.status),
  ]);
  const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.value);
    return acc;
  }, {});
  const total = Number(totalRows[0]?.value ?? 0);
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
    .where(where)
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
  const { role } = await requireSession({ redirectToLogin: true });
  if (role === 'USER' || !hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE)) {
    throw new ForbiddenError();
  }

  const [patient] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.id, patientId), isNull(patients.archivedAt)))
    .limit(1);

  if (!patient) throw new ForbiddenError();
}
