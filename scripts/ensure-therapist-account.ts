import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, therapistSchedules, users } from '@/db/schema';
import { getAuth } from '@/lib/auth';

/**
 * Memastikan satu akun terapis ada dan bisa dipakai login.
 *
 * Pemakaian:
 *   tsx --env-file-if-exists=.env scripts/ensure-therapist-account.ts <email> <password> [nama]
 *
 * Akun dibuat lewat Better Auth (agar hash kata sandi benar), lalu profil diberi
 * `accountType = THERAPIST` dan jadwal kerja default bila belum ada.
 */
const WORK_DAYS = [1, 2, 3, 4, 5, 6];
const DEFAULT_SCHEDULE = { startTime: '09:00', endTime: '17:00' };

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
  const [emailArg, password, nameArg] = process.argv.slice(2);
  if (!emailArg || !password) {
    throw new Error('Pemakaian: ensure-therapist-account.ts <email> <password> [nama]');
  }

  const email = emailArg.trim().toLowerCase();
  const name = (nameArg ?? email.split('@')[0]).replace(/[._-]+/g, ' ').trim();
  const db = getDb();

  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string | undefined = existing?.id;

  if (!userId) {
    const res = await getAuth().api.signUpEmail({
      body: { name, email, password },
    });
    userId = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;
    if (!userId) throw new Error(`Gagal membuat akun ${email}.`);
    console.log(`OK   akun dibuat: ${email}`);
  } else {
    console.log(`OK   akun sudah ada: ${email}`);
  }

  await db
    .insert(profiles)
    .values({ userId, displayName: name, accountType: 'THERAPIST' })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { displayName: name, accountType: 'THERAPIST', updatedAt: new Date() },
    });

  await ensureSchedule(userId);
  console.log(`OK   profil THERAPIST + jadwal default disiapkan (${userId})`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('GAGAL:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
