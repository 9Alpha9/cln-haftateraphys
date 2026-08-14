import { and, eq, ne } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { getAuth } from '@/lib/auth';

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error('SUPER_ADMIN_EMAIL is required.');
  }

  if (process.env.ALLOW_SUPER_ADMIN_BOOTSTRAP !== 'true') {
    throw new Error('Set ALLOW_SUPER_ADMIN_BOOTSTRAP=true to run this script.');
  }

  const db = getDb();
  let [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    if (!process.env.SUPER_ADMIN_PASSWORD) {
      throw new Error('SUPER_ADMIN_PASSWORD is required to create the account.');
    }

    const res = await getAuth().api.signUpEmail({
      body: {
        name: process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin',
        email,
        password: process.env.SUPER_ADMIN_PASSWORD,
      },
    });

    const userId = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;
    if (!userId) {
      throw new Error('Failed to create super-admin user.');
    }

    const [created] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    user = created;
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
