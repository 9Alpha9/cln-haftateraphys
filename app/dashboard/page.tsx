import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, ClipboardCheck, FileText, Activity } from "lucide-react";

const stats = [
  {
    title: "Total Pasien",
    value: "0",
    icon: Users,
    description: "Belum ada pasien terdaftar",
  },
  {
    title: "Intake Review",
    value: "0",
    icon: ClipboardCheck,
    description: "Menunggu review",
  },
  {
    title: "Draft Assessment",
    value: "0",
    icon: FileText,
    description: "Perlu diselesaikan",
  },
  {
    title: "Sesi Hari Ini",
    value: "0",
    icon: Activity,
    description: "Tidak ada jadwal",
  },
];

export default function AdminDashboardPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">
            Kelola pasien dan workflow klinis
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Menu Utama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link
                  href="/dashboard/patients"
                  className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Daftar Pasien
                </Link>
                <Link
                  href="/dashboard/users"
                  className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Manajemen Pengguna
                </Link>
                <Link
                  href="/dashboard/audit-logs"
                  className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Log Audit
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Belum ada aktivitas terbaru
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
