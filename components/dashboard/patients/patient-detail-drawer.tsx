'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  UserRound,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { TherapyScheduleForm } from '@/components/patient/therapy-schedule-form';
import { TherapistAssignControl } from '@/components/dashboard/patients/therapist-assign-control';
import { HomeProgramPanel } from '@/components/dashboard/patients/home-program-panel';
import { TreatmentPlanPanel } from '@/components/dashboard/patients/treatment-plan-panel';
import { CompleteProgramButton } from '@/components/dashboard/patients/complete-program-button';
import { fetchPatientDetailAction } from '@/server/actions/patient-detail';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import { cn } from '@/lib/utils';

type DetailData = Extract<Awaited<ReturnType<typeof fetchPatientDetailAction>>, { ok: true }>['data'];
type TabKey = 'profile' | 'plan' | 'program' | 'intake' | 'assessment' | 'session';

const TABS: {
  key: TabKey;
  label: string;
  description: string;
  icon: typeof Activity;
}[] = [
  {
    key: 'profile',
    label: 'Profil & Program',
    description: 'Identitas, terapis, dan pengaturan program.',
    icon: UserRound,
  },
  {
    key: 'plan',
    label: 'Rencana Terapi',
    description: 'Tujuan, intervensi, dan jadwal evaluasi.',
    icon: ClipboardList,
  },
  {
    key: 'program',
    label: 'Program Latihan',
    description: 'Latihan mandiri yang dibagikan ke pasien.',
    icon: Dumbbell,
  },
  {
    key: 'intake',
    label: 'Intake Awal',
    description: 'Form awal dan status peninjauannya.',
    icon: FileText,
  },
  {
    key: 'assessment',
    label: 'Assessment',
    description: 'Catatan SOAP dan evaluasi klinis.',
    icon: Activity,
  },
  {
    key: 'session',
    label: 'Sesi',
    description: 'Riwayat dan jadwal sesi terapi.',
    icon: CalendarDays,
  },
];

const ACTION_BUTTON =
  'h-10 sm:h-11 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0';
const ACTION_PRIMARY =
  'font-bold bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] shadow-2xs';
const ACTION_SECONDARY =
  'font-semibold bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90';

function formatDate(value: Date | string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', options ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

function genderLabel(value: string | null) {
  if (value === 'MALE') return 'Laki-laki';
  if (value === 'FEMALE') return 'Perempuan';
  if (value === 'OTHER') return 'Lainnya';
  return '-';
}

function intakeStatusLabel(value: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draf',
    SUBMITTED: 'Menunggu Ditinjau',
    UNDER_REVIEW: 'Sedang Ditinjau',
    NEEDS_REVISION: 'Perlu Revisi',
    ACCEPTED: 'Diterima',
    ARCHIVED: 'Diarsipkan',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    SCHEDULED: 'Terjadwal',
    CONFIRMED: 'Terkonfirmasi',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    RESCHEDULED: 'Dijadwalkan ulang',
    NO_SHOW: 'Tidak hadir',
  };
  return labels[value] ?? value;
}

function sessionTypeLabel(value: string) {
  const labels: Record<string, string> = {
    INITIAL_ASSESSMENT: 'Assessment Awal',
    THERAPY_SESSION: 'Sesi Terapi',
    FOLLOW_UP: 'Sesi Lanjutan',
    EVALUATION: 'Evaluasi Klinis',
    DISCHARGE: 'Pemeriksaan Akhir',
    CONSULTATION: 'Konsultasi',
  };
  return labels[value] ?? value;
}

function sessionStatusClass(value: string) {
  if (value === 'COMPLETED') return 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]';
  if (value === 'CANCELLED' || value === 'NO_SHOW') return 'bg-[var(--hafta-red-50)] text-[var(--hafta-red-700)] border-[var(--hafta-red-200)]';
  return 'bg-[var(--hafta-ylw-50)] text-[var(--hafta-ylw-950)] border-[var(--hafta-ylw-200)]';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{label}</p>
      <p className="mt-0.5 break-words text-xs font-semibold leading-relaxed text-[#181700] sm:text-sm">
        {value || '-'}
      </p>
    </div>
  );
}

function MetricBars({ records, field, label }: { records: TherapyProgressView[]; field: 'painScore' | 'rangeOfMotionScore' | 'strengthScore' | 'functionScore'; label: string }) {
  const latest = records[records.length - 1];
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <span className="font-mono text-sm font-bold text-[#181700]">{latest ? `${latest[field]}/10` : '-'}</span>
      </div>
      <p className="mt-1 text-[10px] font-medium text-stone-400">
        {latest ? `Data per ${formatDate(latest.recordedAt)}` : 'Belum ada data evaluasi'}
      </p>
      <div className="mt-3 flex h-12 items-end gap-1">
        {records.length === 0 ? (
          <div className="h-1 w-full rounded-full bg-stone-100" />
        ) : (
          records.slice(-10).map((record) => (
            <div
              key={record.id}
              className={cn(
                'flex-1 rounded-t-sm',
                field === 'painScore' ? 'bg-[var(--hafta-org-400)]' : 'bg-[var(--hafta-grn-500)]',
              )}
              style={{ height: `${Math.max(8, record[field] * 10)}%` }}
              title={`${formatDate(record.recordedAt)}: ${record[field]}/10`}
            />
          ))
        )}
      </div>
      <p className="mt-2 text-[10px] text-stone-400">Menampilkan hingga 10 evaluasi terakhir.</p>
    </div>
  );
}

export function PatientDetailDrawer({ isOpen, onClose, patientId }: { isOpen: boolean; onClose: () => void; patientId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [assessmentPage, setAssessmentPage] = useState(1);
  const ASSESSMENT_PAGE_SIZE = 4;
  const [rawData, setRawData] = useState<DetailData | null>(null);
  const [error, setError] = useState<{ patientId: string; message: string } | null>(null);
  const [editingRecord, setEditingRecord] = useState<TherapyProgressView | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [showProgramMenu, setShowProgramMenu] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    fetchPatientDetailAction(patientId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setRawData(result.data);
        setError(null);
      } else {
        setError({ patientId, message: result.error });
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen, patientId, reloadToken]);

  const data = rawData?.patient.id === patientId ? rawData : null;
  const currentError = error?.patientId === patientId ? error.message : null;
  const patient = data?.patient;
  const progress = data?.progress ?? [];
  const chronologicalProgress = [...progress].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const completedSessions = data?.sessions.filter((session) => session.status === 'COMPLETED').length ?? 0;
  const remainingSessions =
    data?.sessions.filter((session) => session.status === 'SCHEDULED' || session.status === 'CONFIRMED')
      .length ?? 0;
  const patientOptions = patient ? [{ id: patient.id, label: patient.fullName }] : [];
  const assessmentPageCount = Math.max(1, Math.ceil(progress.length / ASSESSMENT_PAGE_SIZE));
  const safeAssessmentPage = Math.min(assessmentPage, assessmentPageCount);
  const visibleAssessments = progress.slice(
    (safeAssessmentPage - 1) * ASSESSMENT_PAGE_SIZE,
    safeAssessmentPage * ASSESSMENT_PAGE_SIZE,
  );

  function closeDrawer() {
    setActiveTab('profile');
    onClose();
  }

  return (
    <>
      <GlobalSlideOver
        isOpen={isOpen}
        onClose={closeDrawer}
        size="lg"
        icon={
          data?.avatarKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarKey} alt={patient?.fullName ?? 'Pasien'} className="h-full w-full rounded-full object-cover" />
          ) : (
            <UserRound className="h-5 w-5" />
          )
        }
        title={patient?.fullName ?? 'Detail Pasien'}
        subtitle={
          patient
            ? `${patient.caseStatus} • ${data?.therapistName ?? 'Belum ada terapis'} • No. RM ${
                patient.medicalRecordNumber ?? 'Belum ditetapkan'
              }`
            : 'Memuat data pasien...'
        }
        headerTabs={
          <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 no-scrollbar"
            role="tablist"
            aria-label="Detail pasien"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex min-w-[148px] max-w-[190px] shrink-0 snap-start cursor-pointer flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left transition-colors',
                    active
                      ? 'border-[#181700] bg-[#181700] text-white shadow-2xs'
                      : 'border-stone-200/80 bg-white text-stone-600 hover:bg-stone-50',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold leading-tight">
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        active ? 'text-[var(--hafta-ylw-100)]' : 'text-stone-500',
                      )}
                    />
                    {tab.label}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] leading-snug',
                      active ? 'text-white/70' : 'text-stone-500',
                    )}
                  >
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        }
        footer={
          data && patient ? (
            <div className="flex items-center justify-between gap-3 w-full">
              {data.capabilities.canEditRecord ? (
                <button
                  type="button"
                  onClick={() => setCreatingRecord(true)}
                  className={cn(ACTION_BUTTON, ACTION_PRIMARY)}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  Catat Assessment Baru
                </button>
              ) : <div />}

              <div className="relative">
                <button
                  type="button"
                  aria-label="Menu opsi program"
                  onClick={() => setShowProgramMenu((prev) => !prev)}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white text-[#181700] transition-colors hover:bg-stone-100 shadow-2xs"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showProgramMenu && (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup menu"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setShowProgramMenu(false)}
                    />
                    <div className="absolute bottom-full right-0 z-20 mb-2 w-56 origin-bottom-right rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_12px_32px_rgba(24,23,0,0.14)]">
                      {data.capabilities.canCreateAppointment ? (
                        <span onClick={(e) => e.stopPropagation()}>
                          <NewAppointmentButton
                            defaultPatientId={patient.id}
                            className="flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-xs font-semibold text-stone-700 shadow-none transition-colors hover:bg-stone-100 hover:text-[#181700] [&>span]:w-full [&>span]:justify-start"
                          >
                            <CalendarPlus className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                            <span>Jadwalkan Sesi Baru</span>
                          </NewAppointmentButton>
                        </span>
                      ) : null}
                      {data.capabilities.canCompleteProgram &&
                      (patient.caseStatus === 'ACTIVE' || patient.caseStatus === 'ON_HOLD') ? (
                        <span onClick={(e) => e.stopPropagation()}>
                          <CompleteProgramButton
                            patientId={patient.id}
                            patientName={patient.fullName}
                            onCompleted={() => setReloadToken((token) => token + 1)}
                            className="flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-xs font-semibold text-stone-700 shadow-none transition-colors hover:bg-stone-100 hover:text-[#181700] [&>span]:w-full [&>span]:justify-start"
                          />
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {!data && !currentError ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Memuat detail pasien...</p>
          </div>
        ) : currentError || !data || !patient ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 text-center">
            <UserRound className="h-9 w-9 text-stone-300" />
            <p className="text-sm font-semibold text-[#181700]">Data pasien tidak dapat dimuat</p>
            <p className="max-w-sm text-xs text-stone-500">{currentError ?? 'Silakan coba lagi.'}</p>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="space-y-3 sm:space-y-5">
            <div className="rounded-2xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/35 p-3.5 sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                Terapis Pendamping
              </p>
              <p className="mt-1 text-sm font-bold text-[#181700] sm:text-base">
                {data.therapistName ?? 'Belum ada terapis'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                Terapis utama yang mendampingi program terapi pasien ini.
              </p>
              {data.capabilities.canAssignTherapist ? (
                <TherapistAssignControl
                  patientId={patient.id}
                  currentTherapistId={data.assignedTherapistId ?? null}
                  options={data.therapistOptions}
                />
              ) : null}
            </div>

            <div className="rounded-2xl border border-stone-200/70 bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
              <InfoRow label="Nomor Rekam Medis" value={patient.medicalRecordNumber ?? '-'} />
              <InfoRow label="Status Kasus" value={patient.caseStatus} />
              <InfoRow label="Jenis Kelamin" value={genderLabel(patient.gender)} />
              <InfoRow label="Tanggal Lahir" value={formatDate(patient.dateOfBirth)} />
              <InfoRow label="Pekerjaan" value={patient.occupation ?? '-'} />
              <InfoRow label="Telepon" value={data.phone ?? '-'} />
              <div className="sm:col-span-2">
                <InfoRow label="Email" value={data.email ?? '-'} />
              </div>
              <div className="sm:col-span-2">
                <InfoRow label="Alamat" value={patient.addressLine ?? '-'} />
              </div>
              <div className="sm:col-span-2">
                <InfoRow
                  label="Kontak Darurat"
                  value={[patient.emergencyContactName, patient.emergencyContactRelationship, patient.emergencyContactPhone]
                    .filter(Boolean)
                    .join(' • ') || '-'}
                />
              </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <ClipboardList className="h-4 w-4 text-stone-500" />
                <h3 className="text-sm font-bold text-[#181700]">Program Terapi</h3>
              </div>
              {data.capabilities.canEditSchedule ? (
                <TherapyScheduleForm
                  patientId={patient.id}
                  initialValues={{
                    nextTherapyAt: patient.nextTherapyAt,
                    therapyFrequencyText: patient.therapyFrequencyText,
                    therapyGoal: patient.therapyGoal,
                    therapistNote: patient.therapistNote,
                  }}
                />
              ) : (
                <div className="space-y-3 text-sm text-stone-600">
                  <p>Tujuan: {patient.therapyGoal || '-'}</p>
                  <p>Frekuensi: {patient.therapyFrequencyText || '-'}</p>
                  <p>Kunjungan berikutnya: {formatDate(patient.nextTherapyAt)}</p>
                </div>
              )}
            </div>

            {patient.caseStatus === 'COMPLETED' ? (
              <div className="rounded-2xl border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)]/60 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--hafta-grn-700)]" />
                  <h3 className="text-sm font-bold text-[#181700]">Program Terapi Selesai</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {patient.caseCompletionSummary || 'Program terapi telah ditutup.'}
                </p>
                <p className="mt-2 text-[11px] text-stone-500">
                  Diselesaikan {formatDate(patient.caseCompletedAt)}
                </p>
              </div>
            ) : null}
          </div>
        ) : activeTab === 'plan' ? (
          <TreatmentPlanPanel
            patientId={patient.id}
            patientName={patient.fullName}
            initialPlan={data.treatmentPlan}
            canManage={data.capabilities.canEditRecord}
            onSaved={() => setReloadToken((token) => token + 1)}
          />
        ) : activeTab === 'program' ? (
          <HomeProgramPanel
            patientId={patient.id}
            patientName={patient.fullName}
            initialProgram={data.homeProgram}
            canManage={data.capabilities.canEditRecord}
            onSaved={() => setReloadToken((token) => token + 1)}
          />
        ) : activeTab === 'intake' ? (
          data.intake ? (
            <div className="space-y-3">
              <div className="w-full rounded-2xl border border-stone-200/70 bg-[#FBFBFA] p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                      Status Intake
                    </p>
                    <span className="mt-1.5 inline-flex rounded-full border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)] px-2.5 py-1 text-[11px] font-bold text-[#181700]">
                      {intakeStatusLabel(data.intake.status)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Dikirim {formatDate(data.intake.submittedAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-stone-500" />
                  <h3 className="text-sm font-bold text-[#181700]">Ringkasan Intake</h3>
                </div>
                <dl className="space-y-3.5">
                  {[
                    ['Keluhan utama', data.intake.chiefComplaint],
                    ['Area terdampak', data.intake.affectedArea],
                    ['Awal keluhan', data.intake.onsetDescription],
                    ['Pemicu', data.intake.triggeringEvent],
                    ['Faktor memperberat', data.intake.aggravatingFactors],
                    ['Faktor meringankan', data.intake.relievingFactors],
                    ['Keterbatasan harian', data.intake.dailyLimitations],
                    ['Riwayat cedera', data.intake.previousInjuryHistory],
                    ['Riwayat operasi', data.intake.surgeryHistory],
                    ['Riwayat medis', data.intake.relevantMedicalHistory],
                    ['Obat saat ini', data.intake.currentMedication],
                    ['Alergi', data.intake.allergies],
                    ['Tujuan pasien', data.intake.patientGoal],
                    ['Catatan review', data.intake.reviewMessage],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
                        {label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#181700] sm:text-sm">
                        {value || '-'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
              <ClipboardList className="h-9 w-9 text-stone-300" />
              <p className="text-sm font-semibold text-[#181700]">Belum ada intake awal</p>
              <p className="max-w-sm text-xs text-stone-500">Form intake akan tampil di sini setelah pasien mengirimkannya.</p>
            </div>
          )
        ) : activeTab === 'assessment' ? (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <p className="text-xs text-stone-500">{progress.length} catatan assessment</p>
              {progress[0] ? (
                <p className="text-[10px] text-stone-400">
                  Evaluasi terbaru {formatDate(progress[0].recordedAt)}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <MetricBars records={chronologicalProgress} field="painScore" label="Nyeri (VAS)" />
              <MetricBars records={chronologicalProgress} field="rangeOfMotionScore" label="ROM" />
              <MetricBars records={chronologicalProgress} field="strengthScore" label="Kekuatan" />
              <MetricBars records={chronologicalProgress} field="functionScore" label="Fungsi" />
            </div>

            {progress.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
                <Activity className="h-8 w-8 text-stone-300" />
                <p className="text-sm font-semibold text-[#181700]">Belum ada assessment</p>
                <p className="text-xs text-stone-500">Catat assessment pertama untuk memulai pemantauan.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleAssessments.map((record) => (
                  <article key={record.id} className="rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#181700]">{formatDate(record.recordedAt)}</p>
                        <p className="text-xs text-stone-500">Oleh {record.therapistName ?? '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            record.status === 'FINALIZED'
                              ? 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                              : 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[var(--hafta-org-700)]',
                          )}
                        >
                          {record.status === 'FINALIZED' ? 'Final' : 'Draft'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          <Eye className="h-3 w-3" />
                          {record.patientVisible ? 'Pasien' : 'Internal'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-stone-600">{record.diagnosis || 'Belum ada diagnosis'}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-3 font-mono text-[11px] text-stone-500">
                        <span>Nyeri {record.painScore}</span>
                        <span>ROM {record.rangeOfMotionScore}</span>
                        <span>Kuat {record.strengthScore}</span>
                        <span>Fungsi {record.functionScore}</span>
                      </div>
                      {data.capabilities.canEditRecord && (
                        <button
                          type="button"
                          onClick={() => setEditingRecord(record)}
                          className={cn(ACTION_BUTTON, ACTION_SECONDARY)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>
                    </article>
                  ))}
                </div>
                <PaginationBar
                  page={safeAssessmentPage}
                  pageCount={assessmentPageCount}
                  onPageChange={setAssessmentPage}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4">
                <p className="text-[11px] font-medium text-stone-500 sm:text-xs">Total sesi</p>
                <p className="mt-1 font-mono text-xl font-bold text-[#181700] sm:text-2xl">{data.sessions.length}</p>
              </div>
              <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4">
                <p className="text-[11px] font-medium text-stone-500 sm:text-xs">Sesi selesai</p>
                <p className="mt-1 font-mono text-xl font-bold text-[var(--hafta-grn-700)] sm:text-2xl">{completedSessions}</p>
              </div>
              <div className="rounded-2xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/60 p-3 sm:p-4">
                <p className="text-[11px] font-medium text-stone-500 sm:text-xs">Sisa sesi</p>
                <p className="mt-1 font-mono text-xl font-bold text-[#181700] sm:text-2xl">{remainingSessions}</p>
              </div>
            </div>


            {data.sessions.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
                <CalendarPlus className="h-8 w-8 text-stone-300" />
                <p className="text-sm font-semibold text-[#181700]">Belum ada sesi</p>
                <p className="text-xs text-stone-500">Jadwalkan sesi terapi pertama untuk pasien ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.sessions
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
                  )
                  .map((session, index) => (
                    <article key={session.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-4">
                      <div>
                        <p className="text-sm font-bold text-[#181700]">Kunjungan Ke-{index + 1}</p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {formatDate(session.scheduledDate)} • {session.startTime} WIB • {session.durationMinutes} menit • {session.therapistName ?? '-'}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">{sessionTypeLabel(session.type)}</p>
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', sessionStatusClass(session.status))}>
                        {statusLabel(session.status)}
                      </span>
                    </article>
                ))}
              </div>
            )}
          </div>
        )}
      </GlobalSlideOver>

      <MedicalRecordFormDrawer
        isOpen={creatingRecord}
        onClose={() => setCreatingRecord(false)}
        patientOptions={patientOptions}
        defaultPatientId={patientId}
        onSaved={() => setReloadToken((token) => token + 1)}
      />
      <MedicalRecordFormDrawer
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        patientOptions={patientOptions}
        onSaved={() => setReloadToken((token) => token + 1)}
      />
    </>
  );
}
