import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patients, profiles, users } from '@/db/schema';
import { PERMISSIONS, requirePatientAccess } from '@/lib/permissions';
import { getPatientTherapist } from '@/server/queries/patients';

export type PatientDetailSession = {
  id: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  therapistName: string | null;
};

export async function getPatientDetail(patientId: string) {
  const patient = await requirePatientAccess(patientId, PERMISSIONS.PATIENT_READ);
  const db = getDb();

  const [account] = await db
    .select({ email: users.email, phone: profiles.phone, avatarKey: profiles.avatarKey })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, patient.userId))
    .limit(1);

  const [therapistName, sessions] = await Promise.all([
    getPatientTherapist(patientId),
    db
      .select({
        id: appointments.id,
        scheduledDate: appointments.scheduledDate,
        startTime: appointments.startTime,
        durationMinutes: appointments.durationMinutes,
        type: appointments.type,
        status: appointments.status,
        therapistName: users.name,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.therapistId, users.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.scheduledDate), desc(appointments.startTime))
      .limit(50),
  ]);

  return {
    patient,
    email: account?.email ?? null,
    phone: account?.phone ?? null,
    therapistName,
    sessions: sessions satisfies PatientDetailSession[],
  };
}
