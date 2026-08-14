import { asc, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { patients, profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';

export type AppointmentSelectOption = { id: string; label: string };

export async function getAppointmentFormOptions() {
  const { session, role } = await requireSession({ redirectToLogin: true });
  if (!hasPermission(role, PERMISSIONS.APPOINTMENT_CREATE) || role === 'USER' || role === 'SUPER_ADMIN') {
    throw new ForbiddenError();
  }

  const db = getDb();
  const patientOptions = await db
    .select({ id: patients.id, label: patients.fullName })
    .from(patients)
    .where(isNull(patients.archivedAt))
    .orderBy(asc(patients.fullName));

  const therapistOptions =
    role === 'THERAPIST'
      ? [{ id: session.user.id, label: session.user.name || 'Terapis saat ini' }]
      : await db
          .select({ id: users.id, label: users.name })
          .from(users)
          .innerJoin(profiles, eq(profiles.userId, users.id))
          .where(eq(profiles.accountType, 'THERAPIST'))
          .orderBy(asc(users.name));

  return {
    patientOptions,
    therapistOptions: therapistOptions.filter((option): option is AppointmentSelectOption => Boolean(option.label)),
  };
}
