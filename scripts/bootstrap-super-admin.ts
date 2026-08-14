import { and, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

if (!email) {
  throw new Error('SUPER_ADMIN_EMAIL is required.');
}

if (process.env.ALLOW_SUPER_ADMIN_BOOTSTRAP !== 'true') {
  throw new Error('Set ALLOW_SUPER_ADMIN_BOOTSTRAP=true to run this script.');
}

const db = getDb();
const [user] = await db
  .select({ id: users.id, email: users.email, name: users.name })
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

if (!user) {
  throw new Error('No existing user matches SUPER_ADMIN_EMAIL.');
}

await db.transaction(async (tx) => {
  await tx
    .insert(profiles)
    .values({
      userId: user.id,
      displayName: user.name,
      accountType: 'SUPER_ADMIN',
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        accountType: 'SUPER_ADMIN',
        updatedAt: new Date(),
      },
    });

  await tx
    .update(profiles)
    .set({ accountType: 'USER', updatedAt: new Date() })
    .where(and(ne(profiles.userId, user.id), eq(profiles.accountType, 'SUPER_ADMIN')));
});

console.log('Super Admin bootstrap completed.');
