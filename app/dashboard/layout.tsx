import { DashboardShellRouter } from "@/components/dashboard/dashboard-shell-router";
import { getUserRole } from "@/lib/get-user-role";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  return <DashboardShellRouter role={role}>{children}</DashboardShellRouter>;
}
