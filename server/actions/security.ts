'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/require-session';
import { notifyUser } from '@/server/notify';
import { recordAudit } from '@/server/audit';

/**
 * Called from the client after a successful password change (Better Auth runs
 * in the browser). Records the change in the audit log and notifies the user.
 */
export async function notifyPasswordChanged() {
  const { session } = await requireSession({ redirectToLogin: false });

  await notifyUser({
    userId: session.user.id,
    title: 'Kata sandi diubah',
    message: 'Kata sandi akun Anda berhasil diperbarui. Gunakan kata sandi baru pada login berikutnya.',
    actionUrl: '/dashboard/security',
  });

  await recordAudit('auth.password-changed', {
    targetType: 'user',
    targetId: session.user.id,
    meta: { actorId: session.user.id },
  });

  revalidatePath('/dashboard/security');
}
