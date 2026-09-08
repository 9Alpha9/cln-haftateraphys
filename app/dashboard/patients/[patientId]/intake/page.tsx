import { ClipboardList } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { IntakeReviewActions } from '@/components/dashboard/intake-review-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/require-session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getScopedIntakeForReview } from '@/server/queries/intake-review';

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  DRAFT:           { label: 'Draft',          color: 'text-[#6B7280]',  bg: 'bg-[#F9FAFB]',    border: 'border-[#E5E7EB]' },
  SUBMITTED:       { label: 'Terkirim',       color: 'text-[#1D4ED8]',  bg: 'bg-[#EFF6FF]',    border: 'border-[#BFDBFE]' },
  UNDER_REVIEW:    { label: 'Sedang Ditinjau', color: 'text-[var(--hafta-ylw-400)]',  bg: 'bg-[#FFF7ED]',    border: 'border-[#FED7AA]' },
  NEEDS_REVISION:  { label: 'Perlu Perbaikan', color: 'text-[#DC2626]',  bg: 'bg-[#FEF2F2]',    border: 'border-[#FECACA]' },
  ACCEPTED:        { label: 'Diterima',        color: 'text-[#15803D]',  bg: 'bg-[#F0FDF4]',    border: 'border-[#BBF7D0]' },
  ARCHIVED:        { label: 'Diarsipkan',      color: 'text-[#6B7280]',  bg: 'bg-[#F9FAFB]',    border: 'border-[#E5E7EB]' },
};

const fields = [
  ['Keluhan utama', 'chiefComplaint'],
  ['Area yang dikeluhkan', 'affectedArea'],
  ['Awal keluhan', 'onsetDescription'],
  ['Pemicu', 'triggeringEvent'],
  ['Keterbatasan aktivitas', 'dailyLimitations'],
  ['Target pasien', 'patientGoal'],
  ['Riwayat cedera', 'previousInjuryHistory'],
  ['Riwayat operasi', 'surgeryHistory'],
  ['Riwayat medis relevan', 'relevantMedicalHistory'],
  ['Obat saat ini', 'currentMedication'],
  ['Alergi', 'allergies'],
] as const;

export default async function PatientIntakeReviewPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const { role } = await requireSession({ redirectToLogin: true });
  const intake = await getScopedIntakeForReview(patientId);

  if (!intake)
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title="Form Awal"
          description="Belum ada Form Awal yang dapat ditinjau."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Form Awal' },
          ]}
          icon={<ClipboardList className="h-7 w-7 text-white" />}
        />
      </div>
    );
  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardPageHeader
          title={`Form Awal · ${intake.patientName}`}
          description=""
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Pasien', href: '/dashboard/patients' },
            { label: 'Form Awal' },
          ]}
          icon={<ClipboardList className="h-7 w-7 text-white" />}
        />
        {/* Status badge */}
        {(function StatusBadge() {
          const cfg = statusConfig[intake.status] ?? statusConfig['DRAFT'];
          const dotColor: Record<string, string> = {
            DRAFT:          'bg-[#9CA3AF]',
            SUBMITTED:      'bg-[#3B82F6]',
            UNDER_REVIEW:   'bg-[var(--hafta-ylw-400)]',
            NEEDS_REVISION: 'bg-[#EF4444]',
            ACCEPTED:       'bg-[#22C55E]',
            ARCHIVED:       'bg-[#9CA3AF]',
          };
          return (
            <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor[intake.status] ?? dotColor['DRAFT']}`} />
              <span>Status: <strong>{cfg.label}</strong></span>
            </div>
          );
        })()}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pasien</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {fields.map(([label, key]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {intake[key] || 'Tidak diisi'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        {intake.reviewMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Pesan untuk pasien</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{intake.reviewMessage}</p>
            </CardContent>
          </Card>
        ) : null}
        <IntakeReviewActions
          patientId={patientId}
          status={intake.status}
          canReview={hasPermission(role, PERMISSIONS.INTAKE_REVIEW)}
          canRequestRevision={hasPermission(role, PERMISSIONS.INTAKE_REQUEST_REVISION)}
          canAccept={hasPermission(role, PERMISSIONS.INTAKE_ACCEPT)}
        />
      </div>
    </>
  );
}
