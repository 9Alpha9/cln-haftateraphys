"use client";

import { PatientDashboardShell } from "@/components/patient/patient-dashboard-shell";
import { AdminDashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Role } from "@/lib/permissions";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "THERAPIST", "STAFF"];

export function DashboardShellRouter({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  if (ADMIN_ROLES.includes(role)) {
    return <AdminDashboardShell role={role}>{children}</AdminDashboardShell>;
  }

  return <PatientDashboardShell role={role}>{children}</PatientDashboardShell>;
}
