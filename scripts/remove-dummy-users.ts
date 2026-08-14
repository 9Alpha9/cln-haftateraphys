import { getDb } from '@/db';
import { patients, users } from '@/db/schema';
import { inArray, like } from 'drizzle-orm';

/**
 * Removes all dummy users (and their patient records) created by the seed
 * scripts before deploy. Only targets the non-routable `.test` domain, so it
 * can never touch real accounts. Deletes cascade to accounts/sessions/profiles.
 *
 * Run: `pnpm db:seed:dummy:remove`
 */
const DUMMY_DOMAIN_PATTERN = '%@dummy.hafta.test';

const run = async () => {
  const db = getDb();

  const matched = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(like(users.email, DUMMY_DOMAIN_PATTERN));

  if (matched.length === 0) {
    console.log('No dummy users found. Nothing to remove.');
    return;
  }

  console.log(`Removing ${matched.length} dummy user(s):`);
  for (const m of matched) {
    console.log(`  - ${m.email}`);
  }

  const ids = matched.map((m) => m.id);

  const patientCount = await db.delete(patients).where(inArray(patients.userId, ids));
  console.log(`Removed ${patientCount.rowCount ?? 0} patient record(s).`);

  await db.delete(users).where(inArray(users.id, ids));
  console.log('Dummy users removed.');
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
