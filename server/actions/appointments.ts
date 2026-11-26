'use server';

import { and, eq, inArray, lt, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { appointments, appointmentNotificationReads, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { assertPatientSchedulingScope, getAppointmentById } from '@/server/queries/appointments';
import { syncNextTherapyAt } from '@/server/queries/next-therapy-sync';
import { isAppointmentStartPassed } from '@/server/appointment-status';
import { getAppointmentFormOptions } from '@/server/queries/appointment-form-options';
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
  /** Appointment type sudah disatukan; field opsional untuk kompatibilitas data lama. */
  type?: AppointmentType;
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

  if (input.type && !appointmentTypes.includes(input.type)) {
    throw new Error('Jenis appointment tidak valid.');
  }
}

function minutesSinceMidnight(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function createAppointment(input: CreateAppointmentInput, options?: { notifyPatient?: boolean }) {
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
    type: input.type ?? 'THERAPY_SESSION',
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
      type: input.type ?? 'THERAPY_SESSION',
    },
    userId: session.user.id,
  });

  if (patient?.userId && options?.notifyPatient !== false) {
    await notifyUser({
      userId: patient.userId,
      title: 'Jadwal terapi baru',
      message: `Anda memiliki jadwal terapi pada ${formatDateLabel(input.scheduledDate)} pukul ${input.startTime}.`,
      actionUrl: '/dashboard/appointments',
    });
  }

  // Selaraskan "Berikutnya" di portal pasien dengan appointment yang baru dibuat.
  await syncNextTherapyAt(input.patientId);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard/progress');
}

export type UpdateAppointmentInput = {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  /** Appointment type sudah disatukan; field opsional untuk kompatibilitas data lama. */
  type?: AppointmentType;
  administrativeNote?: string;
};

export async function getAppointmentEditData(appointmentId: string) {
  const { role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const [appointment, { therapistOptions }] = await Promise.all([
    getAppointmentById(appointmentId),
    getAppointmentFormOptions(),
  ]);

  if (!appointment) return null;
  return { appointment, therapistOptions };
}

export async function updateAppointment(input: UpdateAppointmentInput) {
  requireCreateAppointmentInput(input);

  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: appointments.id,
      therapistId: appointments.therapistId,
      status: appointments.status,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
    })
    .from(appointments)
    .where(eq(appointments.id, input.appointmentId))
    .limit(1);

  if (!existing) {
    throw new Error('Appointment tidak ditemukan.');
  }

  if (role === 'THERAPIST' && existing.therapistId !== session.user.id) {
    throw new ForbiddenError();
  }

  if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED' || existing.status === 'NO_SHOW') {
    throw new Error('Jadwal yang sudah selesai atau dibatalkan tidak dapat diubah.');
  }

  // Sesi yang jam mulainya sudah lewat dikunci: tidak boleh diubah lagi,
  // hanya bisa diselesaikan atau ditandai tidak hadir.
  if (isAppointmentStartPassed(existing.scheduledDate, existing.startTime)) {
    throw new Error(
      'Sesi yang sudah melewati jam mulai tidak dapat diubah. Selesaikan sesi atau tandai pasien tidak hadir.',
    );
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
      type: input.type ?? 'THERAPY_SESSION',
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
      type: input.type ?? 'THERAPY_SESSION',
    },
    userId: session.user.id,
  });

  // Tanggal/jam berubah → selaraskan kartu "Berikutnya" portal pasien.
  await syncNextTherapyAt(input.patientId);

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/progress');
}

export async function deleteAppointment(appointmentId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [appointment] = await db
    .select({ id: appointments.id, createdBy: appointments.createdBy, patientId: appointments.patientId })
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

  // Jadwal dihapus → "Berikutnya" portal pasien dihitung ulang (bisa jadi NULL).
  await syncNextTherapyAt(appointment.patientId);

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/progress');
}

/**
 * Tandai sesi sebagai TIDAK HADIR (mangkir) oleh terapis.
 *
 * Hanya boleh setelah jam mulai sesi lewat dan selama statusnya masih aktif
 * (SCHEDULED/CONFIRMED). Menulis audit dan menyelaraskan kartu "Berikutnya"
 * portal pasien. Untuk sesi yang ditinggal lebih dari 24 jam tanpa tindakan,
 * sweep `expireMissedAppointments` akan menandainya otomatis.
 */
export async function markAppointmentNoShow(appointmentId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [appointment] = await db
    .select({
      id: appointments.id,
      therapistId: appointments.therapistId,
      patientId: appointments.patientId,
      status: appointments.status,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appointment) {
    throw new Error('Appointment tidak ditemukan.');
  }

  if (role === 'THERAPIST' && appointment.therapistId !== session.user.id) {
    throw new ForbiddenError();
  }

  if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED') {
    throw new Error('Hanya jadwal aktif (Terjadwal/Terkonfirmasi) yang bisa ditandai tidak hadir.');
  }

  if (!isAppointmentStartPassed(appointment.scheduledDate, appointment.startTime)) {
    throw new Error('Penandaan tidak hadir hanya bisa dilakukan setelah jam sesi dimulai.');
  }

  const now = new Date();
  const [updated] = await db
    .update(appointments)
    .set({ status: 'NO_SHOW', updatedAt: now })
    .where(and(eq(appointments.id, appointment.id), inArray(appointments.status, [...activeStatuses])))
    .returning({ id: appointments.id });
  if (!updated) {
    throw new Error('Jadwal telah berubah oleh pengguna lain. Muat ulang halaman.');
  }

  await createAuditLog({
    action: 'appointment.no_show',
    targetType: 'appointment',
    targetId: appointment.id,
    meta: {
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      scheduledDate: appointment.scheduledDate,
      startTime: appointment.startTime,
    },
    userId: session.user.id,
  });

  // Sesi keluar dari daftar mendatang → kartu "Berikutnya" pasien ikut berubah.
  await syncNextTherapyAt(appointment.patientId);

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/progress');
}
