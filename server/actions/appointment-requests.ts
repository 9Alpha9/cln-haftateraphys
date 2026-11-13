'use server';

import { and, asc, eq, gte, inArray, isNull, ne, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { appointmentRequests, appointments, patientAssignments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { notifyUser } from '@/server/notify';
import { createAppointment } from '@/server/actions/appointments';
import { getIndonesianHolidays } from '@/server/queries/indonesian-holidays';
import { getAvailabilityRules } from '@/server/queries/therapist-schedules';
import { ensurePatientProfileForUser } from '@/server/queries/patient-portal';

const ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED'] as const;
const SLOT_MINUTES = 60;

type RequestAppointmentInput = {
  requestedDate: string;
  startTime: string;
  therapistId: string;
  durationMinutes?: number;
  patientNote?: string;
};

type RescheduleAppointmentInput = {
  appointmentId: string;
  requestedDate: string;
  startTime: string;
  therapistId: string;
};

function minutesSinceMidnight(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.slice(0, 10).split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function requestPatientAppointment(input: RequestAppointmentInput) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) {
    throw new ForbiddenError();
  }
  if (!isValidDateKey(input.requestedDate) || !isValidTime(input.startTime) || !input.therapistId) {
    throw new Error('Tanggal, jam, atau fisioterapis tidak valid.');
  }

  const durationMinutes = input.durationMinutes ?? 60;
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
    throw new Error('Durasi sesi tidak valid.');
  }

  const db = getDb();
  // Pendaftaran akun belum tentu membuat baris `patients`. Buat otomatis saat
  // pasien mengajukan jadwal pertamanya agar alur booking dari dashboard tetap
  // berjalan untuk akun yang benar-benar baru.
  const patient = await ensurePatientProfileForUser(session.user.id);
  if (!patient) throw new Error('Data pasien tidak ditemukan.');

  const [therapist] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.id, input.therapistId), eq(profiles.accountType, 'THERAPIST')))
    .limit(1);
  if (!therapist) throw new Error('Fisioterapis tidak ditemukan.');

  const todayKey = localDateKey(new Date());
  if (input.requestedDate < todayKey) {
    throw new Error('Tanggal yang dipilih sudah lewat.');
  }
  const requestedDay = new Date(`${input.requestedDate}T00:00:00`);
  const requestedStart = new Date(`${input.requestedDate}T${input.startTime}:00`);
  if (requestedStart.getTime() <= Date.now()) {
    throw new Error('Jam yang dipilih sudah lewat. Silakan pilih jadwal lain.');
  }
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  if (input.requestedDate > localDateKey(maxDate)) {
    throw new Error('Pengajuan jadwal hanya tersedia maksimal 90 hari ke depan.');
  }

  const holidays = await getIndonesianHolidays(requestedDay.getFullYear()).catch(() => []);
  if (holidays.some((holiday) => holiday.date === input.requestedDate)) {
    throw new Error('Klinik tutup pada tanggal tersebut. Silakan pilih tanggal lain.');
  }

  if (durationMinutes !== SLOT_MINUTES) {
    throw new Error('Jadwal pasien hanya tersedia dalam slot 60 menit.');
  }

  const availabilityRules = await getAvailabilityRules(
    [input.therapistId],
    input.requestedDate,
    input.requestedDate,
  );
  const isOnTimeOff = (availabilityRules.timeOffByTherapist.get(input.therapistId) ?? []).some(
    (item) => item.startDate <= input.requestedDate && item.endDate >= input.requestedDate,
  );
  if (isOnTimeOff) {
    throw new Error('Fisioterapis sedang tidak tersedia pada tanggal tersebut.');
  }

  const start = minutesSinceMidnight(input.startTime);
  const end = start + durationMinutes;
  const fitsSchedule = (availabilityRules.blocksByTherapist.get(input.therapistId) ?? [])
    .filter((block) => block.dayOfWeek === requestedDay.getDay())
    .some((block) => {
      const blockStart = minutesSinceMidnight(block.startTime);
      const blockEnd = minutesSinceMidnight(block.endTime);
      if (start < blockStart || end > blockEnd) return false;
      for (let cursor = blockStart; cursor + SLOT_MINUTES <= blockEnd; cursor += SLOT_MINUTES) {
        if (cursor === start) return true;
      }
      return false;
    });
  if (!fitsSchedule) {
    throw new Error('Slot tersebut tidak tersedia pada jadwal fisioterapis. Silakan pilih jam lain.');
  }

  const existing = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.therapistId, input.therapistId),
        eq(appointments.scheduledDate, input.requestedDate),
        inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
      ),
    );

  const hasConflict = existing.some((appointment) => {
    const existingStart = minutesSinceMidnight(appointment.startTime);
    const existingEnd = existingStart + appointment.durationMinutes;
    return start < existingEnd && end > existingStart;
  });
  if (hasConflict) throw new Error('Slot tersebut sudah terisi. Silakan pilih jam lain.');

  const [duplicate] = await db
    .select({ id: appointmentRequests.id })
    .from(appointmentRequests)
    .where(
      and(
        eq(appointmentRequests.patientId, patient.id),
        eq(appointmentRequests.status, 'PENDING'),
        eq(appointmentRequests.requestedDate, input.requestedDate),
        eq(appointmentRequests.startTime, input.startTime),
      ),
    )
    .limit(1);
  if (duplicate) throw new Error('Anda sudah mengajukan slot ini. Mohon tunggu konfirmasi tim Hafta.');

  const [request] = await db
    .insert(appointmentRequests)
    .values({
      patientId: patient.id,
      therapistId: input.therapistId,
      requestedDate: input.requestedDate,
      startTime: input.startTime,
      durationMinutes,
      patientNote: input.patientNote?.trim() || null,
    })
    .returning({ id: appointmentRequests.id });

  await createAuditLog({
    action: 'appointment.request',
    targetType: 'appointment_request',
    targetId: request.id,
    meta: {
      therapistId: input.therapistId,
      requestedDate: input.requestedDate,
      startTime: input.startTime,
    },
    userId: session.user.id,
  });

  await notifyUser({
    userId: input.therapistId,
    title: 'Pengajuan jadwal baru',
    message: `${session.user.name ?? 'Pasien'} mengajukan sesi pada ${input.requestedDate} pukul ${input.startTime}.`,
    actionUrl: '/dashboard/appointments',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  return { ok: true as const };
}

export async function reschedulePatientAppointment(input: RescheduleAppointmentInput) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER' || !hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) {
    throw new ForbiddenError();
  }
  if (!isValidDateKey(input.requestedDate) || !isValidTime(input.startTime) || !input.therapistId) {
    throw new Error('Tanggal, jam, atau fisioterapis tidak valid.');
  }

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);
  if (!patient) throw new Error('Data pasien tidak ditemukan.');

  const todayKey = localDateKey(new Date());
  const [appointment] = await db
    .select({
      id: appointments.id,
      therapistId: appointments.therapistId,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, input.appointmentId),
        eq(appointments.patientId, patient.id),
        gte(appointments.scheduledDate, todayKey),
        inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
      ),
    )
    .limit(1);
  if (!appointment) throw new Error('Jadwal yang ingin diubah tidak ditemukan atau sudah tidak aktif.');

  const [pendingReschedule] = await db
    .select({ id: appointmentRequests.id })
    .from(appointmentRequests)
    .where(
      and(
        eq(appointmentRequests.rescheduleAppointmentId, appointment.id),
        eq(appointmentRequests.status, 'PENDING'),
      ),
    )
    .limit(1);
  if (pendingReschedule) {
    throw new Error(
      'Anda sudah memiliki pengajuan perubahan jadwal yang sedang menunggu konfirmasi dari terapis. Mohon tunggu hingga disetujui.',
    );
  }

  if (
    appointment.scheduledDate.slice(0, 10) === input.requestedDate &&
    appointment.startTime === input.startTime &&
    appointment.therapistId === input.therapistId
  ) {
    throw new Error('Jadwal baru sama dengan jadwal saat ini. Silakan pilih tanggal atau jam lain.');
  }

  const [therapist] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(users.id, input.therapistId), eq(profiles.accountType, 'THERAPIST')))
    .limit(1);
  if (!therapist) throw new Error('Fisioterapis tidak ditemukan.');

  if (input.requestedDate < todayKey) {
    throw new Error('Tanggal yang dipilih sudah lewat.');
  }
  const requestedDay = new Date(`${input.requestedDate}T00:00:00`);
  const requestedStart = new Date(`${input.requestedDate}T${input.startTime}:00`);
  if (requestedStart.getTime() <= Date.now()) {
    throw new Error('Jam yang dipilih sudah lewat. Silakan pilih jadwal lain.');
  }
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  if (input.requestedDate > localDateKey(maxDate)) {
    throw new Error('Pengajuan jadwal hanya tersedia maksimal 90 hari ke depan.');
  }

  const holidays = await getIndonesianHolidays(requestedDay.getFullYear()).catch(() => []);
  if (holidays.some((holiday) => holiday.date === input.requestedDate)) {
    throw new Error('Klinik tutup pada tanggal tersebut. Silakan pilih tanggal lain.');
  }

  const durationMinutes = appointment.durationMinutes;
  const availabilityRules = await getAvailabilityRules(
    [input.therapistId],
    input.requestedDate,
    input.requestedDate,
  );
  const isOnTimeOff = (availabilityRules.timeOffByTherapist.get(input.therapistId) ?? []).some(
    (item) => item.startDate <= input.requestedDate && item.endDate >= input.requestedDate,
  );
  if (isOnTimeOff) {
    throw new Error('Fisioterapis sedang tidak tersedia pada tanggal tersebut.');
  }

  const start = minutesSinceMidnight(input.startTime);
  const end = start + durationMinutes;
  const fitsSchedule = (availabilityRules.blocksByTherapist.get(input.therapistId) ?? [])
    .filter((block) => block.dayOfWeek === requestedDay.getDay())
    .some((block) => {
      const blockStart = minutesSinceMidnight(block.startTime);
      const blockEnd = minutesSinceMidnight(block.endTime);
      if (start < blockStart || end > blockEnd) return false;
      for (let cursor = blockStart; cursor + SLOT_MINUTES <= blockEnd; cursor += SLOT_MINUTES) {
        if (cursor === start) return true;
      }
      return false;
    });
  if (!fitsSchedule) {
    throw new Error('Slot tersebut tidak tersedia pada jadwal fisioterapis. Silakan pilih jam lain.');
  }

  const existing = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.therapistId, input.therapistId),
        eq(appointments.scheduledDate, input.requestedDate),
        inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
        ne(appointments.id, appointment.id),
      ),
    );

  const hasConflict = existing.some((conflict) => {
    const conflictStart = minutesSinceMidnight(conflict.startTime);
    const conflictEnd = conflictStart + conflict.durationMinutes;
    return start < conflictEnd && end > conflictStart;
  });
  if (hasConflict) throw new Error('Slot tersebut sudah terisi. Silakan pilih jam lain.');

  const [request] = await db
    .insert(appointmentRequests)
    .values({
      patientId: patient.id,
      therapistId: input.therapistId,
      requestedDate: input.requestedDate,
      startTime: input.startTime,
      durationMinutes: appointment.durationMinutes,
      type: appointment.type,
      status: 'PENDING',
      rescheduleAppointmentId: appointment.id,
    })
    .returning({ id: appointmentRequests.id });

  await notifyUser({
    userId: input.therapistId,
    title: 'Pengajuan ubah jadwal pasien',
    message: `Pasien ${patient.fullName} mengajukan perubahan jadwal dari ${formatDateLabel(appointment.scheduledDate)} pukul ${appointment.startTime} ke ${formatDateLabel(input.requestedDate)} pukul ${input.startTime}. Menunggu konfirmasi Anda.`,
    actionUrl: '/dashboard/appointments',
  });

  await createAuditLog({
    action: 'appointment.reschedule_requested',
    targetType: 'appointment_request',
    targetId: request.id,
    meta: {
      appointmentId: appointment.id,
      previousTherapistId: appointment.therapistId,
      previousDate: appointment.scheduledDate.slice(0, 10),
      previousStartTime: appointment.startTime,
      therapistId: input.therapistId,
      requestedDate: input.requestedDate,
      startTime: input.startTime,
    },
    userId: session.user.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/notifications');
  return { ok: true as const };
}

export async function reviewPatientAppointmentRequest({
  requestId,
  action,
  reviewNote,
}: {
  requestId: string;
  action: 'approve' | 'decline';
  reviewNote?: string;
}) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_UPDATE)) throw new ForbiddenError();

  const db = getDb();
  const [request] = await db
    .select({
      id: appointmentRequests.id,
      patientId: appointmentRequests.patientId,
      patientUserId: patients.userId,
      therapistId: appointmentRequests.therapistId,
      therapistName: users.name,
      requestedDate: appointmentRequests.requestedDate,
      startTime: appointmentRequests.startTime,
      durationMinutes: appointmentRequests.durationMinutes,
      status: appointmentRequests.status,
      rescheduleAppointmentId: appointmentRequests.rescheduleAppointmentId,
    })
    .from(appointmentRequests)
    .innerJoin(patients, eq(appointmentRequests.patientId, patients.id))
    .innerJoin(users, eq(appointmentRequests.therapistId, users.id))
    .where(eq(appointmentRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== 'PENDING') throw new Error('Pengajuan tidak ditemukan atau sudah diproses.');
  if (role === 'THERAPIST' && request.therapistId !== session.user.id) throw new ForbiddenError();

  if (action === 'approve') {
    const [activePrimary] = await db
      .select({ staffUserId: patientAssignments.staffUserId })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, request.patientId),
          eq(patientAssignments.assignmentType, 'PRIMARY_THERAPIST'),
          or(isNull(patientAssignments.activeUntil), gte(patientAssignments.activeUntil, new Date())),
        ),
      )
      .limit(1);

    if (activePrimary?.staffUserId !== request.therapistId) {
      const assignmentType = activePrimary ? 'COVERAGE' : 'PRIMARY_THERAPIST';
      await db
        .insert(patientAssignments)
        .values({
          patientId: request.patientId,
          staffUserId: request.therapistId,
          assignmentType,
          createdBy: session.user.id,
        })
        .onConflictDoUpdate({
          target: [
            patientAssignments.patientId,
            patientAssignments.staffUserId,
            patientAssignments.assignmentType,
          ],
          set: { activeUntil: null },
        });
    }

    if (request.rescheduleAppointmentId) {
      const [sourceAppointment] = await db
        .select({
          id: appointments.id,
          scheduledDate: appointments.scheduledDate,
          startTime: appointments.startTime,
          durationMinutes: appointments.durationMinutes,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.id, request.rescheduleAppointmentId),
            eq(appointments.patientId, request.patientId),
            inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
          ),
        )
        .limit(1);
      if (!sourceAppointment) {
        throw new Error('Jadwal asal pengajuan sudah tidak aktif. Minta pasien mengajukan ulang.');
      }

      const requestedStart = minutesSinceMidnight(request.startTime);
      const requestedEnd = requestedStart + request.durationMinutes;
      const conflicts = await db
        .select({
          id: appointments.id,
          startTime: appointments.startTime,
          durationMinutes: appointments.durationMinutes,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.therapistId, request.therapistId),
            eq(appointments.scheduledDate, request.requestedDate),
            inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
            ne(appointments.id, sourceAppointment.id),
          ),
        );
      const hasConflict = conflicts.some((conflict) => {
        const conflictStart = minutesSinceMidnight(conflict.startTime);
        const conflictEnd = conflictStart + conflict.durationMinutes;
        return requestedStart < conflictEnd && requestedEnd > conflictStart;
      });
      if (hasConflict) {
        throw new Error('Slot pengajuan sudah terisi jadwal lain. Tolak pengajuan ini dan minta pasien memilih ulang.');
      }

      await db
        .update(appointments)
        .set({
          scheduledDate: request.requestedDate,
          startTime: request.startTime,
          therapistId: request.therapistId,
          durationMinutes: request.durationMinutes,
          updatedAt: new Date(),
        })
        .where(and(eq(appointments.id, sourceAppointment.id), eq(appointments.patientId, request.patientId)));

      const todayKey = localDateKey(new Date());
      const [nextSession] = await db
        .select({
          scheduledDate: appointments.scheduledDate,
          startTime: appointments.startTime,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, request.patientId),
            inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
            gte(appointments.scheduledDate, todayKey),
          ),
        )
        .orderBy(asc(appointments.scheduledDate), asc(appointments.startTime))
        .limit(1);
      if (nextSession) {
        const [year, month, day] = nextSession.scheduledDate.slice(0, 10).split('-').map(Number);
        const [hours, minutes] = nextSession.startTime.split(':').map(Number);
        await db
          .update(patients)
          .set({ nextTherapyAt: new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0) })
          .where(eq(patients.id, request.patientId));
      }

      await db
        .update(appointmentRequests)
        .set({
          status: 'APPROVED',
          reviewNote: reviewNote?.trim() || null,
          appointmentId: sourceAppointment.id,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointmentRequests.id, requestId));
    } else {
      await createAppointment(
        {
          patientId: request.patientId,
          therapistId: request.therapistId,
          scheduledDate: request.requestedDate,
          startTime: request.startTime,
          durationMinutes: request.durationMinutes,
          type: 'THERAPY_SESSION',
          administrativeNote: reviewNote?.trim() || undefined,
        },
        { notifyPatient: false },
      );

      const [appointment] = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, request.patientId),
            eq(appointments.therapistId, request.therapistId),
            eq(appointments.scheduledDate, request.requestedDate),
            eq(appointments.startTime, request.startTime),
          ),
        )
        .limit(1);

      await db
        .update(appointmentRequests)
        .set({
          status: 'APPROVED',
          reviewNote: reviewNote?.trim() || null,
          appointmentId: appointment?.id ?? null,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointmentRequests.id, requestId));
    }

    if (request.patientUserId) {
      const dateLabel = formatDateLabel(request.requestedDate);
      await notifyUser({
        userId: request.patientUserId,
        title: request.rescheduleAppointmentId ? 'Pengajuan ubah jadwal disetujui' : 'Pengajuan jadwal disetujui',
        message: request.rescheduleAppointmentId
          ? `Pengajuan ubah jadwal Anda ke ${dateLabel} pukul ${request.startTime} telah disetujui oleh fisioterapis.`
          : `Pengajuan jadwal Anda pada ${dateLabel} pukul ${request.startTime} telah disetujui${request.therapistName ? ` bersama ${request.therapistName}` : ''}. Sampai jumpa di klinik Hafta.`,
        actionUrl: '/dashboard/appointments',
      });
    }
  } else {
    await db
      .update(appointmentRequests)
      .set({
        status: 'DECLINED',
        reviewNote: reviewNote?.trim() || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appointmentRequests.id, requestId));

    if (request.patientUserId) {
      const dateLabel = formatDateLabel(request.requestedDate);
      await notifyUser({
        userId: request.patientUserId,
        title: 'Pengajuan jadwal belum disetujui',
        message: request.rescheduleAppointmentId
          ? `Pengajuan perubahan jadwal Anda ke ${dateLabel} pukul ${request.startTime} belum dapat disetujui. Tekan tombol Ubah Jadwal pada kalender untuk memilih tanggal lain.${reviewNote?.trim() ? ` Catatan: ${reviewNote.trim()}` : ''}`
          : reviewNote?.trim() ||
            'Tim Hafta belum dapat menyetujui slot yang diajukan. Silakan pilih tanggal lain melalui portal pasien.',
        actionUrl: '/dashboard/appointments',
      });
    }
  }

  await createAuditLog({
    action: action === 'approve' ? 'appointment.request.approve' : 'appointment.request.decline',
    targetType: 'appointment_request',
    targetId: requestId,
    meta: { reviewNote: reviewNote ?? null },
    userId: session.user.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/notifications');
  return { ok: true as const };
}

export async function cancelPatientAppointmentRequest(requestId: string) {
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (role !== 'USER') throw new ForbiddenError();

  const db = getDb();
  const [patient] = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .where(eq(patients.userId, session.user.id))
    .limit(1);
  if (!patient) throw new Error('Data pasien tidak ditemukan.');

  const [request] = await db
    .select({
      id: appointmentRequests.id,
      therapistId: appointmentRequests.therapistId,
      requestedDate: appointmentRequests.requestedDate,
      startTime: appointmentRequests.startTime,
    })
    .from(appointmentRequests)
    .where(
      and(
        eq(appointmentRequests.id, requestId),
        eq(appointmentRequests.status, 'PENDING'),
        eq(appointmentRequests.patientId, patient.id),
      ),
    )
    .limit(1);
  if (!request) throw new Error('Pengajuan tidak ditemukan atau sudah diproses.');

  const [cancelled] = await db
    .update(appointmentRequests)
    .set({ status: 'CANCELLED', updatedAt: new Date() })
    .where(
      and(
        eq(appointmentRequests.id, requestId),
        eq(appointmentRequests.status, 'PENDING'),
        eq(appointmentRequests.patientId, patient.id),
      ),
    )
    .returning({ id: appointmentRequests.id });

  if (!cancelled) throw new Error('Pengajuan tidak ditemukan atau sudah diproses.');

  const dateLabel = new Date(`${request.requestedDate.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  await Promise.all([
    notifyUser({
      userId: request.therapistId,
      title: 'Pengajuan jadwal dibatalkan pasien',
      message: `${patient.fullName} membatalkan pengajuan sesi pada ${dateLabel} pukul ${request.startTime}.`,
      actionUrl: '/dashboard/appointments',
    }),
    notifyUser({
      userId: session.user.id,
      title: 'Pengajuan jadwal dibatalkan',
      message: `Pengajuan sesi pada ${dateLabel} pukul ${request.startTime} telah dibatalkan.`,
      actionUrl: '/dashboard/appointments',
    }),
  ]);

  await createAuditLog({
    action: 'appointment.request.cancel',
    targetType: 'appointment_request',
    targetId: requestId,
    meta: {
      therapistId: request.therapistId,
      requestedDate: request.requestedDate,
      startTime: request.startTime,
    },
    userId: session.user.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  return { ok: true as const };
}
