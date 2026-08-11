import { PatientDashboardShell } from "@/components/patient/patient-dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientDashboardShell>{children}</PatientDashboardShell>;
}
