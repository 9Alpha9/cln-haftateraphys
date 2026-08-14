import { DashboardShellRouter } from '@/components/dashboard/dashboard-shell-router';
import { requireSession } from '@/lib/auth/require-session';
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, session } = await requireSession({ redirectToLogin: true });
  const unreadCount = await getUnreadNotificationsCount();
  const recentNotifications = await getRecentNotifications();

  return (
    <DashboardShellRouter role={role} userName={session.user.name ?? ''} unreadCount={unreadCount} recentNotifications={recentNotifications}>
      {children}
    </DashboardShellRouter>
  );
}
