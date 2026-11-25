import {
  Activity,
  Archive,
  Bell,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  FileText,
  FolderOpen,
  LayoutGrid,
  Monitor,
  ShieldCheck,
  type LucideIcon,
  Settings,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import { type Permission, PERMISSIONS } from './constants';
import { type Role } from './roles';
import { hasPermission } from './policy';

export type DashboardNavigationItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  children?: DashboardNavigationItem[];
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavigationItem[];
};

const staffNavigation: DashboardNavGroup[] = [
  {
    label: 'Menu',
    items: [
      {
        label: 'Beranda',
        href: '/dashboard',
        icon: LayoutGrid,
      },
      {
        label: 'Jadwal',
        icon: CalendarDays,
        children: [
          {
            label: 'Daftar Sesi',
            href: '/dashboard/appointments',
            icon: CalendarDays,
            requiredPermission: PERMISSIONS.APPOINTMENT_LIST,
          },
          {
            label: 'Kalender Terapi',
            href: '/dashboard/calendar',
            icon: CalendarDays,
            requiredPermission: PERMISSIONS.CALENDAR_EVENT_READ,
          },
          {
            label: 'Jadwal Kerja Terapis',
            href: '/dashboard/therapist-schedule',
            icon: CalendarClock,
            requiredPermission: PERMISSIONS.APPOINTMENT_UPDATE,
          },
        ],
      },
      {
        label: 'Pasien',
        icon: Users,
        requiredPermission: PERMISSIONS.PATIENT_LIST,
        children: [
          {
            label: 'Pasien Aktif',
            href: '/dashboard/patients',
            icon: Users,
            requiredPermission: PERMISSIONS.PATIENT_LIST,
          },
          {
            label: 'Pasien Diarsipkan',
            href: '/dashboard/patients/archived',
            icon: Archive,
            requiredPermission: PERMISSIONS.PATIENT_LIST,
          },
        ],
      },
      {
        label: 'Rekam Medis',
        href: '/dashboard/progress',
        icon: Activity,
        requiredPermission: PERMISSIONS.PROGRESS_READ,
      },
      {
        label: 'Dokumen',
        href: '/dashboard/documents',
        icon: FolderOpen,
        requiredPermission: PERMISSIONS.DOCUMENT_LIST,
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
      {
        label: 'Pengaturan',
        href: '/dashboard/settings',
        icon: Settings,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        label: 'Pemeliharaan',
        href: '/dashboard/maintenance',
        icon: Wrench,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
      },
    ],
  },
  {
    label: 'Akun',
    items: [
      { label: 'Data Saya', href: '/dashboard/profile', icon: UserRound },
      { label: 'Perangkat & Sesi', href: '/dashboard/sessions', icon: Monitor },
    ],
  },
];

const patientNavigation: DashboardNavGroup[] = [
  {
    label: 'Menu',
    items: [
      {
        label: 'Beranda',
        href: '/dashboard',
        icon: LayoutGrid,
      },
      {
        label: 'Jadwal',
        icon: CalendarDays,
        children: [
          {
            label: 'Daftar Sesi',
            href: '/dashboard/appointments',
            icon: CalendarDays,
          },
        ],
      },
      {
        label: 'Terapi',
        icon: Activity,
        children: [
          {
            label: 'Rekam Medis',
            href: '/dashboard/progress',
            icon: Activity,
            requiredPermission: PERMISSIONS.PROGRESS_READ_OWN,
          },
          {
            label: 'Latihan Saya',
            href: '/dashboard/exercises',
            icon: Dumbbell,
            requiredPermission: PERMISSIONS.PROGRESS_READ_OWN,
          },
          {
            label: 'Dokumen',
            href: '/dashboard/documents',
            icon: FolderOpen,
            requiredPermission: PERMISSIONS.DOCUMENT_READ_OWN,
          },
          {
            label: 'Riwayat',
            href: '/dashboard/history',
            icon: FileText,
          },
        ],
      },
      {
        label: 'Akun',
        icon: UserRound,
        children: [
          {
            label: 'Data Saya',
            href: '/dashboard/profile',
            icon: UserRound,
          },
          {
            label: 'Perangkat & Sesi',
            href: '/dashboard/sessions',
            icon: Monitor,
          },
          {
            label: 'Notifikasi',
            href: '/dashboard/notifications',
            icon: Bell,
          },
          {
            label: 'Consent & Privasi',
            href: '/dashboard/consent',
            icon: ShieldCheck,
            requiredPermission: PERMISSIONS.CONSENT_READ_OWN,
          },
        ],
      },
    ],
  },
];

export type { Role } from './roles';

function filterItem(role: Role, item: DashboardNavigationItem): DashboardNavigationItem | null {
  if (item.children) {
    const children = item.children
      .map((child) => filterItem(role, child))
      .filter((child): child is DashboardNavigationItem => child !== null);
    if (children.length === 0) return null;
    return { ...item, children };
  }

  if (item.requiredPermission && !hasPermission(role, item.requiredPermission)) return null;
  return item;
}

export function getDashboardNavigation(role: Role): DashboardNavGroup[] {
  const groups = role === 'USER' ? patientNavigation : staffNavigation;

  const mapped = groups
    .map((group) => ({
      label: group.label,
      items: group.items
        .map((item) => filterItem(role, item))
        .filter((item): item is DashboardNavigationItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);

  if (role === 'THERAPIST') {
    for (const group of mapped) {
      for (const item of group.items) {
        for (const child of item.children ?? []) {
          if (child.href === '/dashboard/therapist-schedule') {
            child.label = 'Jadwal Kerja Saya';
          }
        }
      }
    }
  }

  return mapped;
}

function flatten(items: DashboardNavigationItem[]): DashboardNavigationItem[] {
  return items.flatMap((item) => (item.children ? flatten(item.children) : [item]));
}

export function getDashboardNavigationFlat(role: Role): DashboardNavigationItem[] {
  return getDashboardNavigation(role).flatMap((group) => flatten(group.items));
}
