import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { type Permission, PERMISSIONS } from './constants';
import { type Role } from './roles';
import { hasPermission } from './policy';

export type DashboardNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
};

const adminNavigation: DashboardNavigationItem[] = [
  {
    label: 'Jadwal',
    href: '/dashboard/appointments',
    icon: CalendarDays,
    requiredPermission: PERMISSIONS.APPOINTMENT_LIST,
  },
  {
    label: 'Pasien',
    href: '/dashboard/patients',
    icon: Users,
    requiredPermission: PERMISSIONS.PATIENT_LIST,
  },
  {
    label: 'Intake',
    href: '/dashboard/intake',
    icon: ClipboardList,
    requiredPermission: PERMISSIONS.INTAKE_READ,
  },
  {
    label: 'Pengguna',
    href: '/dashboard/users',
    icon: Users,
    requiredPermission: PERMISSIONS.USER_LIST,
  },
  {
    label: 'Log Audit',
    href: '/dashboard/audit-logs',
    icon: FileText,
    requiredPermission: PERMISSIONS.AUDIT_READ,
  },
  {
    label: 'Pengaturan Sistem',
    href: '/dashboard/settings',
    icon: Settings,
    requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
  },
];

const patientNavigation: DashboardNavigationItem[] = [
  { label: 'Ringkasan', href: '/dashboard', icon: ClipboardList },
  { label: 'Jadwal', href: '/dashboard/appointments', icon: CalendarDays },
  {
    label: 'Progress',
    href: '/dashboard/progress',
    icon: ChartNoAxesCombined,
    requiredPermission: PERMISSIONS.PROGRESS_READ_OWN,
  },
  { label: 'Data Saya', href: '/dashboard/profile', icon: Users },
  { label: 'Form Awal', href: '/dashboard/intake', icon: ClipboardList },
  { label: 'Riwayat', href: '/dashboard/history', icon: FileText },
  { label: 'Keamanan', href: '/dashboard/security', icon: ShieldCheck },
];

export type { Role } from './roles';

export function getDashboardNavigation(role: Role) {
  const items = role === 'USER' ? patientNavigation : adminNavigation;

  return items.filter((item) => !item.requiredPermission || hasPermission(role, item.requiredPermission));
}
