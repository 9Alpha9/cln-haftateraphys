'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { patientAssignments, patients, profiles, users } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS, type Role } from '@/lib/permissions';
import { recordAudit } from '@/server/audit';

const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional(),
  password: z.string().min(12, 'Password minimal 12 karakter'),
  role: z.enum(['ADMIN', 'THERAPIST', 'STAFF', 'USER']),
});

export type CreateUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function createUser(input: unknown): Promise<CreateUserResult> {
  try {
    const { name, email, phone, password, role } = createUserSchema.parse(input);
    const { session, role: actorRole } = await requireSession({
      redirectToLogin: false,
    });

    if (!hasPermission(actorRole, PERMISSIONS.USER_CREATE)) {
      return { ok: false, error: 'Anda tidak memiliki izin untuk membuat akun.' };
    }

    if (actorRole !== 'SUPER_ADMIN' && role !== 'USER') {
      return { ok: false, error: 'Anda hanya dapat membuat akun pasien.' };
    }

    const db = getDb();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return { ok: false, error: 'Email sudah terdaftar.' };
    }

    const res = await getAuth().api.signUpEmail({
      body: {
        name,
        email: email.toLowerCase(),
        password,
      },
    });

    const userId = (res as { user?: { id: string } }).user?.id ?? (res as { id?: string }).id;

    if (!userId) {
      return { ok: false, error: 'Gagal membuat akun pengguna.' };
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values({
          userId,
          displayName: name,
          phone: phone ?? null,
          accountType: role as Role,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            accountType: role as Role,
            displayName: name,
            phone: phone ?? undefined,
            updatedAt: new Date(),
          },
        });

      if (role === 'USER') {
        const [patient] = await tx
          .insert(patients)
          .values({ userId, fullName: name })
          .returning({ id: patients.id });

        if (actorRole === 'THERAPIST') {
          await tx.insert(patientAssignments).values({
            patientId: patient.id,
            staffUserId: session.user.id,
            assignmentType: 'PRIMARY_THERAPIST',
            createdBy: session.user.id,
          });
        }
      }
    });

    await recordAudit('user.create', {
      targetType: 'user',
      targetId: userId,
      meta: { createdBy: session.user.id, createdEmail: email.toLowerCase(), role },
    });

    revalidatePath('/dashboard/users');
    return { ok: true, userId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Data tidak valid.' };
    }
    return {
      ok: false,
      error: `Gagal membuat akun: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
