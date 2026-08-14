import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { appointments, patients, users } from '@/db/schema';

/**
 * Seeds a spread of dummy appointments across the dummy patients so the
 * dashboard charts render meaningfully. De-identified, run locally only.
 * Remove before deploy via `pnpm db:seed:dummy:remove`.
 */
const STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
const TYPES = ['INITIAL_ASSESSMENT', 'THERAPY_SESSION', 'FOLLOW_UP', 'EVALUATION'] as const;

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed dummy appointments in production.');
  }

  const db = getDb();

  const [therapist] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'therapist@dummy.hafta.test'))
    .limit(1);
  if (!therapist) throw new Error('Run `pnpm db:seed:dummy` first.');

  const DUMMY_EMAILS = [
    'patient1@dummy.hafta.test',
    'patient2@dummy.hafta.test',
    'patient3@dummy.hafta.test',
    'patient4@dummy.hafta.test',
    'patient5@dummy.hafta.test',
  ];

  const targets = await db
    .select({ id: patients.id })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(inArray(users.email, DUMMY_EMAILS));

  if (targets.length === 0) {
    console.log('No dummy patients found. Run `pnpm db:seed:dummyPatients` first.');
    return;
  }

  const values: (typeof appointments.$inferInsert)[] = [];

  const existing = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.therapistId, therapist.id))
    .limit(1);
  if (existing.length === 0) {
    for (let i = 0; i < 28; i++) {
      const patient = targets[i % targets.length];
      const day = new Date();
      day.setDate(day.getDate() - (i % 14));
      const hours = (9 + (i % 8)) * 100;
      values.push({
        patientId: patient.id,
        therapistId: therapist.id,
        createdBy: therapist.id,
        scheduledDate: day.toISOString(),
        startTime: `${String(Math.floor(hours / 100)).padStart(2, '0')}:00`,
        durationMinutes: [15, 30, 45, 60, 90][i % 5],
        type: TYPES[i % TYPES.length],
        status: STATUSES[i % STATUSES.length],
        administrativeNote: 'Jadwal simulasi untuk pengujian dashboard.',
      });
    }
    await db.insert(appointments).values(values);
    console.log(`Seeded ${values.length} dummy appointments.`);
  } else {
    console.log(`Dummy appointments already exist (${existing.length}). Skipping.`);
  }
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
