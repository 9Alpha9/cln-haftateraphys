'use client';

import { usePathname } from 'next/navigation';
import { PatientDashboardShell } from '@/components/patient/patient-dashboard-shell';
import { AdminDashboardShell } from '@/components/dashboard/dashboard-shell';
import type { NotificationView } from "@/components/dashboard/notification-bell";
import type { Role } from '@/lib/permissions';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'THERAPIST', 'STAFF'];

export function DashboardShellRouter({
  children,
  role,
  userName,
  unreadCount,
  recentNotifications,
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  unreadCount?: number;
  recentNotifications?: NotificationView[];
}) {
  const pathname = usePathname();
  if (pathname.endsWith('/print')) return <>{children}</>;

  if (ADMIN_ROLES.includes(role)) {
    return (
      <AdminDashboardShell role={role} userName={userName} unreadCount={unreadCount} recentNotifications={recentNotifications}>
        {children}
      </AdminDashboardShell>
    );
  }

  return (
    <PatientDashboardShell role={role} userName={userName} unreadCount={unreadCount} recentNotifications={recentNotifications}>
      {children}
    </PatientDashboardShell>
  );
}
