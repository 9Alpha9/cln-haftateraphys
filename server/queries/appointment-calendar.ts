import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients, users, profiles } from '@/db/schema';
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
  therapistImage: string | null;
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
      userImage: users.image,
      avatarKey: profiles.avatarKey,
      readId: appointmentNotificationReads.id,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(users, eq(appointments.therapistId, users.id))
    .leftJoin(profiles, eq(appointments.therapistId, profiles.userId))
    .leftJoin(
      appointmentNotificationReads,
      and(
        eq(appointmentNotificationReads.appointmentId, appointments.id),
        eq(appointmentNotificationReads.userId, session.user.id),
      ),
    )
    .where(and(access, gte(appointments.scheduledDate, start), lte(appointments.scheduledDate, end)))
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime));

  return rows.map(({ readId, userImage, avatarKey, ...appointment }) => ({
    ...appointment,
    isNew: readId === null,
    therapistImage: avatarKey ?? userImage ?? null,
  }));
}

export type ScheduleAppointment = {
  id: string;
  patientId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  patientName: string;
  patientPhone: string | null;
};

export async function getUpcomingScheduleAppointments(): Promise<ScheduleAppointment[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();

  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const access =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'SUPER_ADMIN'
        ? eq(appointments.createdBy, session.user.id)
        : eq(appointments.therapistId, session.user.id);

  const patientProfiles = alias(profiles, 'patient_profiles');

  const rows = await getDb()
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
      status: appointments.status,
      patientName: patients.fullName,
      patientPhone: patientProfiles.phone,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(patientProfiles, eq(patientProfiles.userId, patients.userId))
    .where(and(access, gte(appointments.scheduledDate, start), lte(appointments.scheduledDate, end)))
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime))
    .limit(120);

  return rows;
}

export async function getCalendarAppointmentsRange(startDate: string, endDate: string): Promise<CalendarAppointment[]> {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();

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
      userImage: users.image,
      avatarKey: profiles.avatarKey,
      readId: appointmentNotificationReads.id,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(users, eq(appointments.therapistId, users.id))
    .leftJoin(profiles, eq(appointments.therapistId, profiles.userId))
    .leftJoin(
      appointmentNotificationReads,
      and(
        eq(appointmentNotificationReads.appointmentId, appointments.id),
        eq(appointmentNotificationReads.userId, session.user.id),
      ),
    )
    .where(and(access, gte(appointments.scheduledDate, startDate), lte(appointments.scheduledDate, endDate)))
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime));

  return rows.map(({ readId, userImage, avatarKey, ...appointment }) => ({
    ...appointment,
    isNew: readId === null,
    therapistImage: avatarKey ?? userImage ?? null,
  }));
}
