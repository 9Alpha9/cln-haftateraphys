import type { Role } from "@/lib/permissions";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  THERAPIST: "Terapis",
  STAFF: "Staff",
  USER: "Pasien",
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-blue-100 text-blue-700",
  THERAPIST: "bg-emerald-100 text-emerald-700",
  STAFF: "bg-amber-100 text-amber-700",
  USER: "bg-gray-100 text-gray-700",
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleColor(role: Role): string {
  return ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700";
}
