import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * Dummy users for local development / testing only.
 * Every email uses a non-routable `.test` domain so nothing is ever sent to a
 * real mailbox. Remove before deploy: `pnpm db:seed:dummy:remove`.
 */
const DUMMY_DOMAIN = '.test';

const dummyUsers = [
  {
    name: 'Andi Cahyono',
    email: 'admin@dummy.hafta.test',
    password: 'DummyAdmin!2026',
    phone: '0811-0000-0001',
    accountType: 'ADMIN' as const,
  },
  {
    name: 'Dewi Lestari',
    email: 'therapist@dummy.hafta.test',
    password: 'DummyTherapist!2026',
    phone: '0811-0000-0002',
    accountType: 'THERAPIST' as const,
  },
  {
    name: 'Siti Rahma',
    email: 'staff@dummy.hafta.test',
    password: 'DummyStaff!2026',
    phone: '0811-0000-0003',
    accountType: 'STAFF' as const,
  },
  {
    name: 'Budi Santoso',
    email: 'patient@dummy.hafta.test',
    password: 'DummyPatient!2026',
    phone: '0811-0000-0004',
    accountType: 'USER' as const,
  },
  {
    name: 'Hendra Wijaya',
    email: 'superadmin@dummy.hafta.test',
    password: 'DummySuperAdmin!2026',
    phone: '0811-0000-0005',
    accountType: 'SUPER_ADMIN' as const,
  },
];

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed dummy users in production.');
  }

  const db = getDb();

  for (const u of dummyUsers) {
    const email = u.email.toLowerCase();

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existing) {
      await upsertProfile(db, existing.id, u);
      console.log(`OK   ${email} exists, role ensured (${u.accountType})`);
      continue;
    }

    const res = await getAuth().api.signUpEmail({
      body: { name: u.name, email, password: u.password },
    });

    const userId = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;

    if (!userId) {
      console.error(`FAILED ${email}: no user id returned`);
      continue;
    }

    await upsertProfile(db, userId, u);
    console.log(`OK   ${email} created (${u.accountType})`);
  }

  console.log(`Seeding dummy users completed (${DUMMY_DOMAIN}).`);
};

const upsertProfile = async (db: ReturnType<typeof getDb>, userId: string, u: (typeof dummyUsers)[number]) => {
  await db
    .insert(profiles)
    .values({
      userId,
      displayName: u.name,
      phone: u.phone,
      accountType: u.accountType,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: u.name,
        phone: u.phone,
        accountType: u.accountType,
        updatedAt: new Date(),
      },
    });
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
