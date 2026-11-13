'use server';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/db';
import { homeProgramItems, homePrograms, patientAssignments, patients } from '@/db/schema';
import { requireSession } from '@/lib/auth/require-session';
import { createAuditLog } from '@/lib/audit';
import { ForbiddenError, hasPermission, PERMISSIONS } from '@/lib/permissions';
import { notifyUser } from '@/server/notify';

const itemSchema = z.object({
  name: z.string().trim().min(2, 'Nama latihan minimal 2 karakter.').max(200),
  instruction: z.string().trim().min(3, 'Instruksi latihan wajib diisi.').max(2000),
  sets: z.coerce.number().int().min(0).max(999).nullable().optional(),
  repetitions: z.coerce.number().int().min(0).max(999).nullable().optional(),
  durationSeconds: z.coerce.number().int().min(0).max(86400).nullable().optional(),
  frequencyText: z.string().trim().max(200).nullable().optional(),
  precaution: z.string().trim().max(500).nullable().optional(),
});

const homeProgramSchema = z.object({
  patientId: z.string().uuid(),
  patientVisible: z.boolean(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Tambahkan minimal satu latihan.').max(20),
});

export type SaveHomeProgramResult = { ok: true; id: string } | { ok: false; error: string };

function optionalNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveHomeProgram(input: unknown): Promise<SaveHomeProgramResult> {
  try {
    const data = homeProgramSchema.parse(input);
    const { session, role } = await requireSession({ redirectToLogin: false });
    if (!hasPermission(role, PERMISSIONS.PROGRESS_READ)) {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola program latihan.' };
    }
    if (role === 'USER') {
      return { ok: false, error: 'Pasien tidak dapat mengubah program latihan.' };
    }

    const db = getDb();
    const [patient] = await db
      .select({ id: patients.id, userId: patients.userId })
      .from(patients)
      .where(eq(patients.id, data.patientId))
      .limit(1);
    if (!patient) return { ok: false, error: 'Pasien tidak ditemukan.' };

    if (role === 'THERAPIST') {
      const [assignment] = await db
        .select({ id: patientAssignments.id })
        .from(patientAssignments)
        .where(
          and(
            eq(patientAssignments.patientId, data.patientId),
            eq(patientAssignments.staffUserId, session.user.id),
            isNull(patientAssignments.activeUntil),
          ),
        )
        .limit(1);
      if (!assignment) {
        return { ok: false, error: 'Anda tidak memiliki akses ke pasien ini.' };
      }
    }

    const [existing] = await db
      .select({ id: homePrograms.id })
      .from(homePrograms)
      .where(eq(homePrograms.patientId, data.patientId))
      .orderBy(desc(homePrograms.updatedAt))
      .limit(1);

    const now = new Date();
    const values = {
      status: 'ACTIVE' as const,
      startsAt: parseDate(data.startsAt),
      endsAt: parseDate(data.endsAt),
      patientVisible: data.patientVisible ? 1 : 0,
      updatedAt: now,
    };

    let programId = existing?.id;
    if (programId) {
      await db.update(homePrograms).set(values).where(eq(homePrograms.id, programId));
      await db.delete(homeProgramItems).where(eq(homeProgramItems.homeProgramId, programId));
    } else {
      const [created] = await db
        .insert(homePrograms)
        .values({
          patientId: data.patientId,
          createdBy: session.user.id,
          ...values,
        })
        .returning({ id: homePrograms.id });
      programId = created.id;
    }

    await db.insert(homeProgramItems).values(
      data.items.map((item, index) => ({
        homeProgramId: programId,
        name: item.name,
        instruction: item.instruction,
        sets: optionalNumber(item.sets),
        repetitions: optionalNumber(item.repetitions),
        durationSeconds: optionalNumber(item.durationSeconds),
        frequencyText: item.frequencyText?.trim() || null,
        precaution: item.precaution?.trim() || null,
        sortOrder: index,
        updatedAt: now,
      })),
    );

    await createAuditLog({
      action: 'home_program.save',
      targetType: 'home_program',
      targetId: programId,
      meta: {
        patientId: data.patientId,
        itemCount: data.items.length,
        patientVisible: data.patientVisible,
      },
      userId: session.user.id,
    });

    if (data.patientVisible && patient.userId) {
      await notifyUser({
        userId: patient.userId,
        title: existing ? 'Program latihan diperbarui' : 'Program latihan baru',
        message: 'Fisioterapis Anda telah membagikan program latihan mandiri. Buka halaman Latihan Saya untuk melihat detailnya.',
        actionUrl: '/dashboard/exercises',
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/progress');
    revalidatePath('/dashboard/notifications');
    revalidatePath(`/dashboard/patients/${data.patientId}`);
    return { ok: true, id: programId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? 'Data program tidak valid.' };
    }
    if (error instanceof ForbiddenError) {
      return { ok: false, error: 'Anda tidak memiliki izin mengelola program latihan.' };
    }
    return { ok: false, error: 'Program latihan tidak dapat disimpan. Coba lagi.' };
  }
}
