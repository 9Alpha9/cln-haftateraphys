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
          <div className="relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm opacity-70">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Profil</span>
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Detail profil pasien di bawah</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terbuka di bawah</span>
            </div>
          </div>

          <Link
            href={`/dashboard/patients/${patient.id}/intake`}
            className="group relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground group-hover:text-[#92400e] transition-colors">Intake</span>
              <ClipboardList className="h-5 w-5 text-muted-foreground group-hover:text-[#92400e] transition-colors" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Form awal dan keluhan pasien</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400e] group-hover:underline">Buka Intake &rarr;</span>
            </div>
          </Link>

          <div className="relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm opacity-65">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Assessment</span>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Evaluasi klinis lengkap</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Segera Hadir</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm opacity-65">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Sesi</span>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Riwayat sesi terapi</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Segera Hadir</span>
            </div>
          </div>
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
                <span className="mt-1 inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-[#92400e]">
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
