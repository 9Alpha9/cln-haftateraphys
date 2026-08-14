import { and, eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { patients } from '@/db/schema/patients';
import { requireSession } from '@/lib/auth/require-session';
import { type Permission } from './constants';
import { ForbiddenError, hasPermission } from './policy';

export async function requirePatientAccess(patientId: string, permission: Permission) {
  const { session, role } = await requireSession({ redirectToLogin: true });

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }

  const db = getDb();

  if (role === 'USER') {
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.userId, session.user.id)))
      .limit(1);

    if (!patient) {
      throw new ForbiddenError();
    }

    return patient;
  }

  const [patient] = await db
    .select()
    .from(patients)
    .where(or(eq(patients.id, patientId), eq(patients.userId, patientId)))
    .limit(1);

  if (!patient) {
    throw new ForbiddenError();
  }

  return patient;
}
