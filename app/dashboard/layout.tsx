import { DashboardShellRouter } from '@/components/dashboard/dashboard-shell-router';
import { requireSession } from '@/lib/auth/require-session';
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";
import { getCurrentPatientProfile } from "@/server/queries/patient-profile";
import { getDashboardNavCounts } from "@/server/queries/nav-counts";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { canAccessDashboardPath } from "@/lib/permissions/dashboard-routes";
import DashboardNotFound from './not-found';
import { getMaintenanceFlags, decideMaintenance } from "@/lib/maintenance";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, session } = await requireSession({ redirectToLogin: true });
  const pathname = (await headers()).get('x-pathname');
  /**
   * JANGAN memanggil `notFound()` dari layout: boundary not-found akan jatuh ke
   * root layout sehingga 404 tampil dengan chrome halaman landing. Path yang
   * tidak diizinkan (atau pathname hilang) dirender sebagai 404 DI DALAM shell
   * dashboard agar navigasi panel tetap utuh.
   */
  const accessDenied = !pathname || !canAccessDashboardPath(role, pathname);

  const maintenance = decideMaintenance({ flags: await getMaintenanceFlags() });
  if (maintenance.mode === 'maintenance' && role !== 'SUPER_ADMIN') {
    redirect('/maintenance');
  }

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
      {accessDenied ? <DashboardNotFound /> : children}
    </DashboardShellRouter>
  );
}
