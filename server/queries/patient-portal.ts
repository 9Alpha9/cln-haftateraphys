import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  appointmentRequests,
  appointments,
  patients,
  profiles,
  therapistSchedules,
  users,
} from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError } from '@/lib/permissions';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getAvailabilityRules } from '@/server/queries/therapist-schedules';

const ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED'] as const;
const SLOT_MINUTES = 60;

export type PatientPortalAppointment = {
  id: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  therapistName: string | null;
  administrativeNote: string | null;
};

export type PatientAppointmentRequestView = {
  id: string;
  requestedDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  therapistName: string | null;
  patientNote: string | null;
  reviewNote: string | null;
  rescheduleAppointmentId: string | null;
  createdAt: Date;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  therapistId: string;
  therapistName: string;
};

export type AvailabilityDate = {
  date: string;
  slots: AvailabilitySlot[];
};

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function minutesSinceMidnight(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

async function getOwnPatient() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role !== 'USER') throw new ForbiddenError();

  const [patient] = await getDb()
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);

  return { patient, userId: session.user.id };
}

export async function getPatientPortalAppointments(): Promise<PatientPortalAppointment[]> {
  const { patient } = await getOwnPatient();
  if (!patient) return [];

  return getDb()
    .select({
      id: appointments.id,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
      status: appointments.status,
      therapistName: users.name,
      administrativeNote: appointments.administrativeNote,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .where(eq(appointments.patientId, patient.id))
    .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime));
}

export async function getPatientAppointmentRequests(): Promise<PatientAppointmentRequestView[]> {
  const { patient } = await getOwnPatient();
  if (!patient) return [];

  return getDb()
    .select({
      id: appointmentRequests.id,
      requestedDate: appointmentRequests.requestedDate,
      startTime: appointmentRequests.startTime,
      durationMinutes: appointmentRequests.durationMinutes,
      type: appointmentRequests.type,
      status: appointmentRequests.status,
      therapistName: users.name,
      patientNote: appointmentRequests.patientNote,
      reviewNote: appointmentRequests.reviewNote,
      rescheduleAppointmentId: appointmentRequests.rescheduleAppointmentId,
      createdAt: appointmentRequests.createdAt,
    })
    .from(appointmentRequests)
    .innerJoin(users, eq(appointmentRequests.therapistId, users.id))
    .where(eq(appointmentRequests.patientId, patient.id))
    .orderBy(desc(appointmentRequests.createdAt));
}

export async function getPatientBookingAvailability(days = 75): Promise<AvailabilityDate[]> {
  const { patient } = await getOwnPatient();
  if (!patient) return [];

  const db = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startKey = toDateKey(today);
  const end = new Date(today);
  end.setDate(end.getDate() + days);
  const endKey = toDateKey(end);

  const therapists = await db
    .selectDistinct({ id: users.id, name: users.name })
    .from(therapistSchedules)
    .innerJoin(users, eq(therapistSchedules.therapistId, users.id))
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(therapistSchedules.isActive, true), eq(profiles.accountType, 'THERAPIST')))
    .orderBy(asc(users.name));

  if (therapists.length === 0) return [];

  const therapistIds = therapists.map((therapist) => therapist.id);
  const [bookedRows, currentYearHolidays, nextYearHolidays, availabilityRules] = await Promise.all([
    db
      .select({
        therapistId: appointments.therapistId,
        scheduledDate: appointments.scheduledDate,
        startTime: appointments.startTime,
        durationMinutes: appointments.durationMinutes,
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.therapistId, therapistIds),
          inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
          gte(appointments.scheduledDate, startKey),
          lte(appointments.scheduledDate, endKey),
        ),
      ),
    getIndonesianHolidays(today.getFullYear()).catch(() => []),
    getIndonesianHolidays(today.getFullYear() + 1).catch(() => []),
    getAvailabilityRules(therapistIds, startKey, endKey),
  ]);

  const holidayKeys = new Set(
    [...currentYearHolidays, ...nextYearHolidays].map((holiday) => holiday.date),
  );
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const bookedByDate = new Map<string, typeof bookedRows>();
  for (const booking of bookedRows) {
    const key = booking.scheduledDate.slice(0, 10);
    bookedByDate.set(key, [...(bookedByDate.get(key) ?? []), booking]);
  }

  const result: AvailabilityDate[] = [];
  for (let offset = 0; offset <= days; offset++) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    const key = toDateKey(day);
    if (holidayKeys.has(key)) continue;

    const bookedForDay = bookedByDate.get(key) ?? [];
    const slots: AvailabilitySlot[] = [];
    const seen = new Set<string>();

    for (const therapist of therapists) {
      const offDays = availabilityRules.timeOffByTherapist.get(therapist.id) ?? [];
      if (offDays.some((item) => item.startDate <= key && item.endDate >= key)) continue;

      const blocks = (availabilityRules.blocksByTherapist.get(therapist.id) ?? []).filter(
        (block) => block.dayOfWeek === day.getDay(),
      );

      for (const block of blocks) {
        for (
          let start = minutesSinceMidnight(block.startTime);
          start + SLOT_MINUTES <= minutesSinceMidnight(block.endTime);
          start += SLOT_MINUTES
        ) {
          const end = start + SLOT_MINUTES;
          const slotKey = `${therapist.id}-${start}`;
          if (seen.has(slotKey)) continue;

          const hasConflict = bookedForDay
            .filter((booking) => booking.therapistId === therapist.id)
            .some((booking) => {
              const bookingStart = minutesSinceMidnight(booking.startTime);
              const bookingEnd = bookingStart + booking.durationMinutes;
              return start < bookingEnd && end > bookingStart;
            });
          if (hasConflict) continue;
          if (key === startKey && start <= nowMinutes) continue;

          seen.add(slotKey);
          slots.push({
            startTime: formatTime(start),
            endTime: formatTime(end),
            therapistId: therapist.id,
            therapistName: therapist.name || 'Fisioterapis Hafta',
          });
        }
      }
    }

    if (slots.length > 0) result.push({ date: key, slots });
  }

  return result;
}

export async function getPendingAppointmentRequests() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (role === 'USER') throw new ForbiddenError();
  const scope =
    role === 'THERAPIST' ? eq(appointmentRequests.therapistId, session.user.id) : undefined;

  return getDb()
    .select({
      id: appointmentRequests.id,
      requestedDate: appointmentRequests.requestedDate,
      startTime: appointmentRequests.startTime,
      durationMinutes: appointmentRequests.durationMinutes,
      type: appointmentRequests.type,
      patientNote: appointmentRequests.patientNote,
      patientName: patients.fullName,
      therapistName: users.name,
      createdAt: appointmentRequests.createdAt,
    })
    .from(appointmentRequests)
    .innerJoin(patients, eq(appointmentRequests.patientId, patients.id))
    .innerJoin(users, eq(appointmentRequests.therapistId, users.id))
    .where(and(eq(appointmentRequests.status, 'PENDING'), scope))
    .orderBy(asc(appointmentRequests.requestedDate), asc(appointmentRequests.startTime));
}

export type PendingAppointmentRequest = Awaited<ReturnType<typeof getPendingAppointmentRequests>>[number];
