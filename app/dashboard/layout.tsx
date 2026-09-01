import { DashboardShellRouter } from '@/components/dashboard/dashboard-shell-router';
import { requireSession } from '@/lib/auth/require-session';
import { getRecentNotifications, getUnreadNotificationsCount } from "@/server/queries/notifications";
import { getCurrentPatientProfile } from "@/server/queries/patient-profile";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, session } = await requireSession({ redirectToLogin: true });
  const unreadCount = await getUnreadNotificationsCount();
  const recentNotifications = await getRecentNotifications();
  let avatarUrl: string | null = null;
  try {
    if (role === 'USER') {
      const p = await getCurrentPatientProfile(session.user.id);
      avatarUrl = p?.avatarKey ?? null;
    } else {
      const db = getDb();
      const [row] = await db.select({ avatarKey: profiles.avatarKey }).from(profiles).where(eq(profiles.userId, session.user.id)).limit(1);
      avatarUrl = row?.avatarKey ?? null;
    }
  } catch {
    avatarUrl = null;
  }

  return (
    <DashboardShellRouter role={role} userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} avatarUrl={avatarUrl} unreadCount={unreadCount} recentNotifications={recentNotifications}>
      {children}
    </DashboardShellRouter>
  );
}
