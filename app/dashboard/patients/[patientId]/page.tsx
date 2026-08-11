import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, User, ClipboardList, FileText, Activity, History } from "lucide-react";

export default function PatientDetailPage({
  params,
}: {
  params: { patientId: string };
}) {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/patients"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Detail Pasien
            </h1>
            <p className="text-muted-foreground">
              ID: {params.patientId}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profil</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lihat dan edit data pasien
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Intake</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Form awal dan keluhan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Assessment
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evaluasi klinis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sesi</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Riwayat sesi terapi
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nama Lengkap
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum ada data)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Status Kasus
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum ada data)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Therapist
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum ditugaskan)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Aktivitas Terakhir
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum ada aktivitas)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
