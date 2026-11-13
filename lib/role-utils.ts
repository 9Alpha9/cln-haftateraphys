import type { Role } from '@/lib/permissions';

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  THERAPIST: 'Terapis',
  STAFF: 'Staff',
  USER: 'Pasien',
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:
    'border border-[var(--hafta-org-200)] bg-[var(--hafta-org-100)] text-[#181700]',
  ADMIN: 'border border-stone-200 bg-stone-100 text-[#181700]',
  THERAPIST:
    'border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]',
  STAFF: 'border border-blue-200 bg-blue-50 text-blue-700',
  USER: 'border border-stone-200 bg-stone-50 text-stone-600',
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleColor(role: Role): string {
  return ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700';
}
