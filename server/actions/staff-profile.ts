'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { profiles, users } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { ForbiddenError } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { staffProfileSchema, type StaffProfileInput } from '@/lib/validators/staff-profile';

function toNullable(value: string | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function updateCurrentStaffProfile(input: StaffProfileInput) {
  const data = staffProfileSchema.parse(input);
  const { session, role } = await requireSession({ redirectToLogin: false });

  if (role === 'USER') throw new ForbiddenError();

  const db = getDb();
  await db
    .update(users)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  await db
    .insert(profiles)
    .values({
      userId: session.user.id,
      displayName: toNullable(data.displayName),
      phone: toNullable(data.phone),
      avatarKey: toNullable(data.avatarKey),
      accountType: role,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        displayName: toNullable(data.displayName),
        phone: toNullable(data.phone),
        avatarKey: toNullable(data.avatarKey),
        updatedAt: new Date(),
      },
    });

  await createAuditLog({
    action: 'profile.update',
    targetType: 'user',
    targetId: session.user.id,
    meta: { actorRole: role },
    userId: session.user.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
}
