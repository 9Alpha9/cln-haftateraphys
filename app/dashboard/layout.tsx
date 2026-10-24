import { DashboardShellRouter } from '@/components/dashboard/dashboard-shell-router';
import { requireSession } from '@/lib/auth/require-session';
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";
import { getCurrentPatientProfile } from "@/server/queries/patient-profile";
import { getPendingIntakeCount } from "@/server/queries/intake-review";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { canAccessDashboardPath } from "@/lib/permissions/dashboard-routes";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, session } = await requireSession({ redirectToLogin: true });
  const pathname = (await headers()).get('x-pathname');
  if (!pathname || !canAccessDashboardPath(role, pathname)) notFound();

  const unreadCount = await getUnreadNotificationsCount();
  const recentNotifications = await getRecentNotifications();
  let avatarUrl: string | null = null;
  let intakePendingCount = 0;
  try {
    if (role === 'USER') {
      const p = await getCurrentPatientProfile(session.user.id);
      avatarUrl = p?.avatarKey ?? null;
    } else {
      const db = getDb();
      const [row] = await db.select({ avatarKey: profiles.avatarKey }).from(profiles).where(eq(profiles.userId, session.user.id)).limit(1);
      avatarUrl = row?.avatarKey ?? null;
      intakePendingCount = await getPendingIntakeCount();
    }
  } catch {
    avatarUrl = null;
  }

  return (
    <DashboardShellRouter role={role} userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} avatarUrl={avatarUrl} unreadCount={unreadCount} recentNotifications={recentNotifications} intakePendingCount={intakePendingCount}>
      {children}
    </DashboardShellRouter>
  );
}
