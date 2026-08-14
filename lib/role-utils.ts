import type { Role } from '@/lib/permissions';

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  THERAPIST: 'Terapis',
  STAFF: 'Staff',
  USER: 'Pasien',
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-primary/10 text-primary',
  ADMIN: 'bg-primary/10 text-primary',
  THERAPIST: 'bg-primary/10 text-primary',
  STAFF: 'bg-primary/10 text-primary',
  USER: 'bg-primary/10 text-primary',
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleColor(role: Role): string {
  return ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700';
}
