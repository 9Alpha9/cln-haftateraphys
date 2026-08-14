import { and, eq, inArray, like, or } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  appointmentNotificationReads,
  appointments,
  homeProgramItems,
  homePrograms,
  internalCalendarEvents,
  patientAssignments,
  patientIntakes,
  patients,
  users,
} from '@/db/schema';

/**
 * Removes ALL dummy data (users on the non-routable `@dummy.hafta.test` domain
 * plus everything they own) in FK-safe order, so the database is clean before
 * seeding a real super-admin. Never touches real accounts.
 *
 * Run: `pnpm db:seed:dummy:removeAll`
 */
const DUMMY_DOMAIN_PATTERN = '%@dummy.hafta.test';

async function main() {
  const db = getDb();

  const dummyUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(like(users.email, DUMMY_DOMAIN_PATTERN));

  const dummyUserIds = dummyUsers.map((u) => u.id);

  const dummyPatients = await db
    .select({ id: patients.id })
    .from(patients)
    .where(inArray(patients.userId, dummyUserIds));
  const dummyPatientIds = dummyPatients.map((p) => p.id);

  if (dummyUserIds.length === 0 && dummyPatientIds.length === 0) {
    console.log('No dummy data found. Nothing to remove.');
    return;
  }

  console.log(`Removing ${dummyUsers.length} dummy user(s) and ${dummyPatientIds.length} patient record(s).`);

  // neon-http driver has no transaction support; deletes run sequentially in
  // FK-safe order (children before parents).
  const dummyAppointments = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      or(
        inArray(appointments.patientId, dummyPatientIds),
        inArray(appointments.therapistId, dummyUserIds),
        inArray(appointments.createdBy, dummyUserIds),
      ),
    );
  const dummyAppointmentIds = dummyAppointments.map((a) => a.id);

  const dummyPrograms = await db
    .select({ id: homePrograms.id })
    .from(homePrograms)
    .where(or(inArray(homePrograms.patientId, dummyPatientIds), inArray(homePrograms.createdBy, dummyUserIds)));
  const dummyProgramIds = dummyPrograms.map((p) => p.id);

  await db
    .delete(appointmentNotificationReads)
    .where(
      or(
        inArray(appointmentNotificationReads.appointmentId, dummyAppointmentIds),
        inArray(appointmentNotificationReads.userId, dummyUserIds),
      ),
    );

  await db
    .delete(patientAssignments)
    .where(
      or(
        inArray(patientAssignments.patientId, dummyPatientIds),
        inArray(patientAssignments.staffUserId, dummyUserIds),
        inArray(patientAssignments.createdBy, dummyUserIds),
      ),
    );

  await db
    .update(appointments)
    .set({ rescheduledFromId: null })
    .where(inArray(appointments.rescheduledFromId, dummyAppointmentIds));
  await db.delete(appointments).where(inArray(appointments.id, dummyAppointmentIds));

  await db.delete(homeProgramItems).where(inArray(homeProgramItems.homeProgramId, dummyProgramIds));
  await db.delete(homePrograms).where(inArray(homePrograms.id, dummyProgramIds));

  await db
    .delete(patientIntakes)
    .where(or(inArray(patientIntakes.patientId, dummyPatientIds), inArray(patientIntakes.reviewedBy, dummyUserIds)));

  await db.delete(internalCalendarEvents).where(inArray(internalCalendarEvents.createdBy, dummyUserIds));

  await db.delete(patients).where(inArray(patients.id, dummyPatientIds));

  await db.delete(users).where(inArray(users.id, dummyUserIds));

  console.log('Dummy data removed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
