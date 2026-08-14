import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients, users } from '@/db/schema';
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
  therapistName: string | null;
  isNew: boolean;
};

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
  const [totalResult] = await db
    .select({ value: count() })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(where);
  const totalPages = Math.max(1, Math.ceil(totalResult.value / pageSize));
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
      therapistName: users.name,
      readId: appointmentNotificationReads.id,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.therapistId, users.id))
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

  return { items, currentPage, totalPages, total: totalResult.value };
}

export async function assertPatientSchedulingScope(patientId: string) {
  const { role } = await requireSession({ redirectToLogin: true });
  if (role === 'USER' || role === 'SUPER_ADMIN' || !hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE)) {
    throw new ForbiddenError();
  }

  const [patient] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.id, patientId), isNull(patients.archivedAt)))
    .limit(1);

  if (!patient) throw new ForbiddenError();
}
