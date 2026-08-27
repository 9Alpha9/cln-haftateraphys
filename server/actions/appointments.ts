'use server';

import { and, eq, inArray, lt, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { appointments, appointmentNotificationReads, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { assertPatientSchedulingScope } from '@/server/queries/appointments';
import { notifyUser } from '@/server/notify';
import { createAuditLog } from '@/lib/audit';

const activeStatuses = ['SCHEDULED', 'CONFIRMED'] as const;
const appointmentTypes = ['INITIAL_ASSESSMENT', 'THERAPY_SESSION', 'FOLLOW_UP', 'EVALUATION'] as const;

type AppointmentType = (typeof appointmentTypes)[number];

export type CreateAppointmentInput = {
  patientId: string;
  therapistId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: AppointmentType;
  administrativeNote?: string;
};

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function requireCreateAppointmentInput(input: CreateAppointmentInput) {
  if (!input.patientId || !input.therapistId || !input.scheduledDate || !isValidTime(input.startTime)) {
    throw new Error('Data appointment tidak valid.');
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 15 || input.durationMinutes > 240) {
    throw new Error('Durasi appointment tidak valid.');
  }

  if (!appointmentTypes.includes(input.type)) {
    throw new Error('Jenis appointment tidak valid.');
  }
}

function minutesSinceMidnight(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export async function createAppointment(input: CreateAppointmentInput) {
  requireCreateAppointmentInput(input);

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE)) {
    throw new ForbiddenError();
  }

  await assertPatientSchedulingScope(input.patientId);

  if (role === 'THERAPIST' && input.therapistId !== session.user.id) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id, userId: patients.userId })
    .from(patients)
    .where(eq(patients.id, input.patientId))
    .limit(1);

  if (!patient) {
    throw new Error('Pasien tidak ditemukan.');
  }

  const existing = await db
    .select({ startTime: appointments.startTime, durationMinutes: appointments.durationMinutes })
    .from(appointments)
    .where(
      and(
        eq(appointments.therapistId, input.therapistId),
        eq(appointments.scheduledDate, input.scheduledDate),
        inArray(appointments.status, activeStatuses),
      ),
    );

  const start = minutesSinceMidnight(input.startTime);
  const end = start + input.durationMinutes;
  const hasConflict = existing.some((appointment) => {
    const currentStart = minutesSinceMidnight(appointment.startTime);
    const currentEnd = currentStart + appointment.durationMinutes;
    return start < currentEnd && end > currentStart;
  });

  if (hasConflict) {
    throw new Error('Terapis sudah memiliki appointment pada waktu tersebut.');
  }

  await db.insert(appointments).values({
    patientId: input.patientId,
    therapistId: input.therapistId,
    scheduledDate: input.scheduledDate,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    type: input.type,
    administrativeNote: input.administrativeNote?.trim() || null,
    createdBy: session.user.id,
  });

  await createAuditLog({
    action: 'appointment.create',
    targetType: 'appointment',
    targetId: input.patientId,
    meta: {
      therapistId: input.therapistId,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      type: input.type,
    },
    userId: session.user.id,
  });

  if (patient?.userId) {
    await notifyUser({
      userId: patient.userId,
      title: 'Jadwal terapi baru',
      message: `Anda memiliki jadwal terapi pada ${input.scheduledDate} pukul ${input.startTime}.`,
      actionUrl: '/dashboard/appointments',
    });
  }

  revalidatePath('/dashboard/appointments');
}

export type UpdateAppointmentInput = {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: AppointmentType;
  administrativeNote?: string;
};

export async function updateAppointment(input: UpdateAppointmentInput) {
  requireCreateAppointmentInput(input);

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: appointments.id, therapistId: appointments.therapistId })
    .from(appointments)
    .where(eq(appointments.id, input.appointmentId))
    .limit(1);

  if (!existing) {
    throw new Error('Appointment tidak ditemukan.');
  }

  if (role === 'THERAPIST' && existing.therapistId !== session.user.id) {
    throw new ForbiddenError();
  }

  await assertPatientSchedulingScope(input.patientId);

  await db
    .update(appointments)
    .set({
      patientId: input.patientId,
      therapistId: input.therapistId,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      type: input.type,
      administrativeNote: input.administrativeNote?.trim() || null,
    })
    .where(eq(appointments.id, input.appointmentId));

  await createAuditLog({
    action: 'appointment.update',
    targetType: 'appointment',
    targetId: input.appointmentId,
    meta: {
      patientId: input.patientId,
      therapistId: input.therapistId,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      type: input.type,
    },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/appointments');
}

export async function deleteAppointment(appointmentId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [appointment] = await db
    .select({ id: appointments.id, createdBy: appointments.createdBy })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appointment) {
    throw new Error('Appointment tidak ditemukan.');
  }

  await db.delete(appointmentNotificationReads).where(eq(appointmentNotificationReads.appointmentId, appointmentId));
  await db.delete(appointments).where(eq(appointments.id, appointmentId));

  await createAuditLog({
    action: 'appointment.cancel',
    targetType: 'appointment',
    targetId: appointmentId,
    meta: { deletedBy: session.user.id },
    userId: session.user.id,
  });

  revalidatePath('/dashboard/appointments');
}
