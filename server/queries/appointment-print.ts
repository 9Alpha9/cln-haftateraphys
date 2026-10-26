import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function getScopedAppointment(id: string) {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_READ)) throw new ForbiddenError();
  const where =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'SUPER_ADMIN'
        ? eq(appointments.createdBy, session.user.id)
        : eq(appointments.therapistId, session.user.id);
  const [appointment] = await getDb()
    .select({
      id: appointments.id,
      scheduledDate: appointments.scheduledDate,
      startTime: appointments.startTime,
      durationMinutes: appointments.durationMinutes,
      type: appointments.type,
      status: appointments.status,
      administrativeNote: appointments.administrativeNote,
      patientName: patients.fullName,
      medicalRecordNumber: patients.medicalRecordNumber,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      addressLine: patients.addressLine,
      addressCity: patients.addressCity,
      phone: profiles.phone,
      therapistName: users.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(appointments.therapistId, users.id))
    .leftJoin(profiles, eq(profiles.userId, patients.userId))
    .where(and(eq(appointments.id, id), where))
    .limit(1);
  if (!appointment) throw new ForbiddenError();
  return appointment;
}
