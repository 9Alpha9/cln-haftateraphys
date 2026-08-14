import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export type CalendarAppointment = {
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

export async function getCalendarAppointments(month: string): Promise<CalendarAppointment[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return [];
  const start = `${month}-01`;
  const end = new Date(year, monthNumber, 0).toISOString().slice(0, 10);
  const access =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'SUPER_ADMIN'
        ? eq(appointments.createdBy, session.user.id)
        : eq(appointments.therapistId, session.user.id);
  const rows = await getDb()
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
        eq(appointmentNotificationReads.userId, session.user.id),
      ),
    )
    .where(and(access, gte(appointments.scheduledDate, start), lte(appointments.scheduledDate, end)))
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime));

  return rows.map(({ readId, ...appointment }) => ({ ...appointment, isNew: readId === null }));
}
