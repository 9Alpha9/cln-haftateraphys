import { requireSession } from '@/lib/auth/require-session';
import { type Permission } from './constants';
import { authorize } from './policy';
import { redirect } from 'next/navigation';

export async function requirePermission(
  permission: Permission,
  resource?: {
    userId?: string;
    patientId?: string;
    therapistId?: string;
    status?: string;
    patientVisible?: boolean;
  },
) {
  const { session, role } = await requireSession({ redirectToLogin: true });

  const authSession = {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: role,
    },
  };

  try {
    authorize({
      session: authSession,
      permission,
      resource,
    });
    return { session: authSession };
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ForbiddenError') {
      // You can return a forbidden page or redirect
      redirect('/dashboard');
    }
    throw error;
  }
}
