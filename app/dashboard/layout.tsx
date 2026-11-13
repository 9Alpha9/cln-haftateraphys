import { DashboardShellRouter } from '@/components/dashboard/dashboard-shell-router';
import { requireSession } from '@/lib/auth/require-session';
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";
import { getCurrentPatientProfile } from "@/server/queries/patient-profile";
import { getDashboardNavCounts } from "@/server/queries/nav-counts";
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

  const [unreadCount, recentNotifications, avatarResult, navCounts] = await Promise.all([
    getUnreadNotificationsCount(),
    getRecentNotifications(),
    (async () => {
      try {
        if (role === 'USER') {
          const p = await getCurrentPatientProfile(session.user.id);
          return p?.avatarKey ?? null;
        }
        const db = getDb();
        const [row] = await db
          .select({ avatarKey: profiles.avatarKey })
          .from(profiles)
          .where(eq(profiles.userId, session.user.id))
          .limit(1);
        return row?.avatarKey ?? null;
      } catch {
        return null;
      }
    })(),
    role === 'USER' ? Promise.resolve(undefined) : getDashboardNavCounts().catch(() => undefined),
  ]);
  const avatarUrl = avatarResult;

  return (
    <DashboardShellRouter role={role} userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} avatarUrl={avatarUrl} unreadCount={unreadCount} recentNotifications={recentNotifications} navCounts={navCounts}>
      {children}
    </DashboardShellRouter>
  );
}
