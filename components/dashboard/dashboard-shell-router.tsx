'use client';

import { usePathname } from 'next/navigation';
import { PatientDashboardShell } from '@/components/patient/patient-dashboard-shell';
import type { NotificationView } from "@/components/dashboard/notification-bell";
import type { Role } from '@/lib/permissions/roles';
import type { DashboardNavCounts } from '@/server/queries/nav-counts';

export function DashboardShellRouter({
  children,
  role,
  userName,
  userEmail,
  avatarUrl,
  unreadCount,
  recentNotifications,
  navCounts,
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
  navCounts?: DashboardNavCounts;
}) {
  const pathname = usePathname();
  if (pathname.endsWith('/print')) return <>{children}</>;

  return (
    <PatientDashboardShell role={role} userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} unreadCount={unreadCount} recentNotifications={recentNotifications} navCounts={navCounts}>
      {children}
    </PatientDashboardShell>
  );
}
