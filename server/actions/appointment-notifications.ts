'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { appointmentNotificationReads, appointments, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function markCalendarAppointmentsRead(appointmentIds: string[]) {
  if (appointmentIds.length === 0) return;
  const { session, role } = await requireSession({ redirectToLogin: false });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_LIST)) throw new ForbiddenError();
  const access =
    role === 'USER'
      ? eq(patients.userId, session.user.id)
      : role === 'SUPER_ADMIN'
        ? eq(appointments.createdBy, session.user.id)
        : eq(appointments.therapistId, session.user.id);
  const rows = await getDb()
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(inArray(appointments.id, appointmentIds), access));
  if (rows.length === 0) return;
  await getDb()
    .insert(appointmentNotificationReads)
    .values(rows.map((row) => ({ appointmentId: row.id, userId: session.user.id })))
    .onConflictDoNothing();
  revalidatePath('/dashboard');
}
