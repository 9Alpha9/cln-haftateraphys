import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, users, therapistSchedules } from '@/db/schema';
import { getAuth } from '@/lib/auth';

/**
 * Dummy therapist accounts for local development / testing only.
 * Emails use the non-routable `.test` domain, and nothing is ever emailed.
 * Remove before deploy: `pnpm db:seed:dummy:remove`.
 */
const PASSWORD = 'DummyTherapist!2026';

const dummyTherapists = [
  { name: 'Hafta Terapis 2', email: 'therapist02@dummy.hafta.test', phone: '0811-0000-0102' },
  { name: 'Hafta Terapis 3', email: 'therapist03@dummy.hafta.test', phone: '0811-0000-0103' },
  { name: 'Hafta Terapis 4', email: 'therapist04@dummy.hafta.test', phone: '0811-0000-0104' },
  { name: 'Hafta Terapis 5', email: 'therapist05@dummy.hafta.test', phone: '0811-0000-0105' },
  { name: 'Hafta Terapis 6', email: 'therapist06@dummy.hafta.test', phone: '0811-0000-0106' },
  { name: 'Hafta Terapis 7', email: 'therapist07@dummy.hafta.test', phone: '0811-0000-0107' },
  { name: 'Hafta Terapis 8', email: 'therapist08@dummy.hafta.test', phone: '0811-0000-0108' },
  { name: 'Hafta Terapis 9', email: 'therapist09@dummy.hafta.test', phone: '0811-0000-0109' },
  { name: 'Hafta Terapis 10', email: 'therapist10@dummy.hafta.test', phone: '0811-0000-0110' },
  { name: 'Hafta Terapis 11', email: 'therapist11@dummy.hafta.test', phone: '0811-0000-0111' },
];

const DEFAULT_SCHEDULE = { startTime: '09:00', endTime: '16:00' };
const WORK_DAYS = [1, 2, 3, 4, 5, 6]; // Senin - Sabtu

async function ensureProfile(userId: string, therapist: (typeof dummyTherapists)[number]) {
  const db = getDb();
  await db
    .insert(profiles)
    .values({
      userId,
      displayName: therapist.name,
      phone: therapist.phone,
      accountType: 'THERAPIST',
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: therapist.name,
        phone: therapist.phone,
        accountType: 'THERAPIST',
        updatedAt: new Date(),
      },
    });
}

async function ensureSchedule(userId: string) {
  const db = getDb();
  const existing = await db
    .select({ id: therapistSchedules.id })
    .from(therapistSchedules)
    .where(eq(therapistSchedules.therapistId, userId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(therapistSchedules).values(
    WORK_DAYS.map((dayOfWeek) => ({
      therapistId: userId,
      dayOfWeek,
      startTime: DEFAULT_SCHEDULE.startTime,
      endTime: DEFAULT_SCHEDULE.endTime,
      isActive: true,
    })),
  );
}

async function run() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed dummy therapists in production.');
  }

  const db = getDb();

  for (const therapist of dummyTherapists) {
    const email = therapist.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string | undefined = existing?.id;

    if (!userId) {
      const res = await getAuth().api.signUpEmail({
        body: { name: therapist.name, email, password: PASSWORD },
      });
      userId = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;
    }

    if (!userId) {
      console.error(`FAILED ${email}: no user id returned`);
      continue;
    }

    await ensureProfile(userId, therapist);
    await ensureSchedule(userId);

    console.log(`OK   ${email} (${therapist.name}) - THERAPIST`);
  }

  const ids = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(
        inArray(
          users.email,
          dummyTherapists.map((therapist) => therapist.email.toLowerCase()),
        ),
      )
  ).map((row) => row.id);

  console.log(`Seeding dummy therapists completed: ${ids.length} akun.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
