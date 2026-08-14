import { Container } from '@/components/container';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { User, ClipboardList, FileText, Activity } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PERMISSIONS, requirePatientAccess, ForbiddenError } from '@/lib/permissions';
import { getPatientTherapist } from '@/server/queries/patients';

export default async function PatientDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  let patient;
  try {
    patient = await requirePatientAccess(patientId, PERMISSIONS.PATIENT_READ);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }
  const therapist = await getPatientTherapist(patient.id);

  return (
    <Container>
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title="Detail Pasien"
          description={`ID pasien: ${patient.id}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Detail Pasien' },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profil</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Lihat dan edit data pasien</p>
            </CardContent>
          </Card>

          <Link
            href={`/dashboard/patients/${patient.id}/intake`}
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Intake</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Form awal dan keluhan</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assessment</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Evaluasi klinis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sesi</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Riwayat sesi terapi</p>
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
                <label className="text-sm font-medium text-foreground">Nama Lengkap</label>
                <p className="mt-1 text-sm text-muted-foreground">{patient.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status Kasus</label>
                <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {patient.caseStatus}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tanggal Lahir</label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.dateOfBirth
                    ? patient.dateOfBirth.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Pekerjaan</label>
                <p className="mt-1 text-sm text-muted-foreground">{patient.occupation ?? '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Alamat</label>
                <p className="mt-1 text-sm text-muted-foreground">{patient.addressLine ?? '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Kontak Darurat</label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.emergencyContactName ?? '-'}
                  {patient.emergencyContactRelationship ? ` (${patient.emergencyContactRelationship})` : ''}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Kontak Darurat Telepon</label>
                <p className="mt-1 text-sm text-muted-foreground">{patient.emergencyContactPhone ?? '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Therapist</label>
                <p className="mt-1 text-sm text-muted-foreground">{therapist ?? '(Belum ditugaskan)'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Terdaftar</label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.createdAt.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
