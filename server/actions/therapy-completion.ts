'use server';

import { and, eq, gte, inArray, isNull, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { appointments, patientAssignments, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { completeProgramSchema, completeSessionSchema } from '@/lib/validators/therapy-completion';
import { notifyUser } from '@/server/notify';

const ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED'] as const;

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function completeAppointmentSession(input: unknown) {
  const data = completeSessionSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_COMPLETE)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [appointment] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      therapistId: appointments.therapistId,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      status: appointments.status,
      completedAt: appointments.completedAt,
      patientUserId: patients.userId,
      patientName: patients.fullName,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.id, data.appointmentId))
    .limit(1);

  if (!appointment) throw new Error('Sesi terapi tidak ditemukan.');
  if (role === 'THERAPIST' && appointment.therapistId !== session.user.id) {
    throw new ForbiddenError();
  }
  if (appointment.completedAt || appointment.status === 'COMPLETED') {
    throw new Error('Sesi terapi ini sudah diselesaikan.');
  }
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status as (typeof ACTIVE_APPOINTMENT_STATUSES)[number])) {
    throw new Error('Hanya sesi terjadwal atau terkonfirmasi yang dapat diselesaikan.');
  }

  const scheduledDate = appointment.scheduledDate.slice(0, 10);
  if (scheduledDate > todayKey()) {
    throw new Error(`Sesi ${formatDateLabel(scheduledDate)} belum berlangsung dan belum dapat diselesaikan.`);
  }

  const now = new Date();
  const [updated] = await db
    .update(appointments)
    .set({
      status: 'COMPLETED',
      completedAt: now,
      completedBy: session.user.id,
      completionNote: data.note?.trim() || null,
      updatedAt: now,
    })
    .where(
      and(
        eq(appointments.id, appointment.id),
        isNull(appointments.completedAt),
        inArray(appointments.status, [...ACTIVE_APPOINTMENT_STATUSES]),
      ),
    )
    .returning({ id: appointments.id });
  if (!updated) throw new Error('Sesi terapi ini sudah diproses oleh pengguna lain.');

  await createAuditLog({
    action: 'appointment.complete',
    targetType: 'appointment',
    targetId: appointment.id,
    meta: {
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      scheduledDate,
    },
    userId: session.user.id,
  });

  await notifyUser({
    userId: appointment.patientUserId,
    title: 'Sesi terapi selesai',
    message: `Sesi terapi Anda pada ${formatDateLabel(scheduledDate)} telah diselesaikan oleh fisioterapis.`,
    actionUrl: '/dashboard/progress',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard/patients');
  revalidatePath(`/dashboard/patients/${appointment.patientId}`);
  revalidatePath('/dashboard/progress');
  return { ok: true as const };
}

export async function completeTherapyProgram(input: unknown) {
  const data = completeProgramSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.PATIENT_COMPLETE_PROGRAM)) {
    throw new ForbiddenError();
  }

  const db = getDb();
  const [patient] = await db
    .select({
      id: patients.id,
      userId: patients.userId,
      fullName: patients.fullName,
      caseStatus: patients.caseStatus,
      archivedAt: patients.archivedAt,
    })
    .from(patients)
    .where(eq(patients.id, data.patientId))
    .limit(1);

  if (!patient) throw new Error('Pasien tidak ditemukan.');
  if (patient.archivedAt) throw new Error('Pasien yang sudah diarsipkan tidak dapat diselesaikan programnya.');

  if (role === 'THERAPIST') {
    const [assignment] = await db
      .select({ id: patientAssignments.id })
      .from(patientAssignments)
      .where(
        and(
          eq(patientAssignments.patientId, patient.id),
          eq(patientAssignments.staffUserId, session.user.id),
          or(isNull(patientAssignments.activeUntil), gte(patientAssignments.activeUntil, new Date())),
        ),
      )
      .limit(1);
    if (!assignment) throw new ForbiddenError();
  }

  if (patient.caseStatus === 'COMPLETED') throw new Error('Program terapi pasien ini sudah selesai.');
  if (patient.caseStatus !== 'ACTIVE' && patient.caseStatus !== 'ON_HOLD') {
    throw new Error('Program terapi hanya dapat diselesaikan saat status pasien ACTIVE atau ON_HOLD.');
  }

  const futureAppointments = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, patient.id),
        gte(appointments.scheduledDate, todayKey()),
        or(eq(appointments.status, 'SCHEDULED'), eq(appointments.status, 'CONFIRMED')),
      ),
    );

  if (futureAppointments.length > 0) {
    throw new Error(
      `Masih ada ${futureAppointments.length} sesi terjadwal. Selesaikan atau batalkan sesi tersebut terlebih dahulu.`,
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(patients)
    .set({
      caseStatus: 'COMPLETED',
      caseCompletedAt: now,
      caseCompletedBy: session.user.id,
      caseCompletionSummary: data.summary,
      nextTherapyAt: null,
      updatedAt: now,
    })
    .where(and(eq(patients.id, patient.id), inArray(patients.caseStatus, ['ACTIVE', 'ON_HOLD'])))
    .returning({ id: patients.id });
  if (!updated) throw new Error('Status program terapi telah berubah. Muat ulang halaman.');

  await createAuditLog({
    action: 'patient.program.complete',
    targetType: 'patient',
    targetId: patient.id,
    meta: { previousStatus: patient.caseStatus },
    userId: session.user.id,
  });

  await notifyUser({
    userId: patient.userId,
    title: 'Program terapi selesai',
    message: 'Program terapi Anda telah dinyatakan selesai oleh tim Hafta Fisioterapi.',
    actionUrl: '/dashboard/progress',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/patients');
  revalidatePath(`/dashboard/patients/${patient.id}`);
  revalidatePath('/dashboard/progress');
  return { ok: true as const };
}
