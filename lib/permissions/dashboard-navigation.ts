import {
  Activity,
  CalendarDays,
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

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavigationItem[];
};

const adminNavigation: DashboardNavGroup[] = [
  {
    label: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: ShieldCheck,
      },
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
        label: 'Rekam Medis',
        href: '/dashboard/progress',
        icon: Activity,
        requiredPermission: PERMISSIONS.PROGRESS_READ,
      },
    ],
  },
  {
    label: 'Administrasi',
    items: [
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
    ],
  },
  {
    label: 'Sistem',
    items: [
      {
        label: 'Pengaturan Sistem',
        href: '/dashboard/settings',
        icon: Settings,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
      },
    ],
  },
];

const patientNavigation: DashboardNavGroup[] = [
  {
    label: 'Ringkasan',
    items: [
      { label: 'Ringkasan', href: '/dashboard', icon: ClipboardList },
      { label: 'Jadwal', href: '/dashboard/appointments', icon: CalendarDays },
      {
        label: 'Rekam Medis',
        href: '/dashboard/progress',
        icon: Activity,
        requiredPermission: PERMISSIONS.PROGRESS_READ_OWN,
      },
    ],
  },
  {
    label: 'Akun Saya',
    items: [
      { label: 'Data Saya', href: '/dashboard/profile', icon: Users },
      { label: 'Form Awal', href: '/dashboard/intake', icon: ClipboardList },
      { label: 'Riwayat', href: '/dashboard/history', icon: FileText },
      { label: 'Keamanan', href: '/dashboard/security', icon: ShieldCheck },
    ],
  },
];

export type { Role } from './roles';

export function getDashboardNavigation(role: Role): DashboardNavGroup[] {
  const groups = role === 'USER' ? patientNavigation : adminNavigation;

  return groups.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) => !item.requiredPermission || hasPermission(role, item.requiredPermission),
    ),
  }));
}

export function getDashboardNavigationFlat(role: Role): DashboardNavigationItem[] {
  return getDashboardNavigation(role).flatMap((group) => group.items);
}
