import { redirect } from 'next/navigation';
import { PERMISSIONS, requirePermission } from '@/lib/permissions';

export default async function NewProgressPage() {
  await requirePermission(PERMISSIONS.PROGRESS_READ);
  redirect('/dashboard/progress');
}
