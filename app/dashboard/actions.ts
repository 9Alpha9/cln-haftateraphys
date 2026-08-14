'use server';

import { requireSession } from '@/lib/auth/require-session';
import type { Role } from '@/lib/permissions';

export async function fetchUserRole(): Promise<Role> {
  const { role } = await requireSession({ redirectToLogin: false }).catch(() => ({ role: 'USER' as Role }));
  return role;
}
