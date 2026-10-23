'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Pencil,
  UserRound,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';
import { NewAppointmentButton } from '@/components/dashboard/appointments/new-appointment-button';
import { TherapyScheduleForm } from '@/components/patient/therapy-schedule-form';
import { CompleteProgramButton } from '@/components/dashboard/patients/complete-program-button';
import { fetchPatientDetailAction } from '@/server/actions/patient-detail';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import { cn } from '@/lib/utils';

type DetailData = Extract<Awaited<ReturnType<typeof fetchPatientDetailAction>>, { ok: true }>['data'];
type TabKey = 'profile' | 'intake' | 'assessment' | 'session';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profil & Program' },
  { key: 'intake', label: 'Intake Awal' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'session', label: 'Sesi' },
];

const ACTION_BUTTON =
  'h-9 px-3.5 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 shrink-0';
const ACTION_SECONDARY =
  'bg-white hover:bg-[var(--hafta-ylw-100)] text-[#181700] border border-stone-200/90 hover:border-[var(--hafta-ylw-200)]';
const ACTION_PRIMARY =
  'bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] border border-[var(--hafta-ylw-200)]';

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
    <div className="rounded-xl border border-stone-200/80 bg-stone-50/40 p-3">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[#181700]">{value || '-'}</p>
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
    </div>
  );
}

export function PatientDetailDrawer({ isOpen, onClose, patientId }: { isOpen: boolean; onClose: () => void; patientId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [rawData, setRawData] = useState<DetailData | null>(null);
  const [error, setError] = useState<{ patientId: string; message: string } | null>(null);
  const [editingRecord, setEditingRecord] = useState<TherapyProgressView | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

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
        icon={<UserRound className="h-5 w-5" />}
        title={patient?.fullName ?? 'Detail Pasien'}
        subtitle={
          patient
            ? `${patient.caseStatus} • ${data?.therapistName ?? 'Belum ada terapis'} • RM ${
                patient.medicalRecordNumber ?? 'Belum ditetapkan'
              }`
            : 'Memuat data pasien...'
        }
        headerTabs={
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Detail pasien">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  activeTab === tab.key
                    ? 'bg-[var(--hafta-ylw-100)] text-[#181700]'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        footer={
          data && patient ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'profile' &&
                data.capabilities.canCompleteProgram &&
                (patient.caseStatus === 'ACTIVE' || patient.caseStatus === 'ON_HOLD') ? (
                  <CompleteProgramButton
                    patientId={patient.id}
                    patientName={patient.fullName}
                    onCompleted={() => setReloadToken((token) => token + 1)}
                    className={cn(ACTION_BUTTON, ACTION_SECONDARY)}
                  />
                ) : null}
                {(activeTab === 'profile' || activeTab === 'session') &&
                data.capabilities.canCreateAppointment ? (
                  <NewAppointmentButton
                    defaultPatientId={patient.id}
                    className={cn(ACTION_BUTTON, ACTION_SECONDARY)}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Jadwalkan Sesi Baru
                  </NewAppointmentButton>
                ) : null}
                {activeTab === 'profile' && data.capabilities.canEditRecord ? (
                  <button
                    type="button"
                    onClick={() => setCreatingRecord(true)}
                    className={cn(ACTION_BUTTON, ACTION_PRIMARY)}
                  >
                    <FileText className="h-4 w-4" />
                    Catat Assessment Baru
                  </button>
                ) : null}
                {activeTab === 'assessment' && data.capabilities.canEditRecord ? (
                  <button
                    type="button"
                    onClick={() => setCreatingRecord(true)}
                    className={cn(ACTION_BUTTON, ACTION_PRIMARY)}
                  >
                    <FileText className="h-4 w-4" />
                    Catat Assessment Baru
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="h-9 cursor-pointer rounded-full px-3.5 text-xs font-semibold text-stone-500 transition-colors hover:text-[#181700]"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeDrawer}
                className="h-9 cursor-pointer rounded-full px-3.5 text-xs font-semibold text-stone-500 transition-colors hover:text-[#181700]"
              >
                Tutup
              </button>
            </div>
          )
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Nomor Rekam Medis" value={patient.medicalRecordNumber ?? '-'} />
              <InfoRow label="Status Kasus" value={patient.caseStatus} />
              <InfoRow label="Jenis Kelamin" value={genderLabel(patient.gender)} />
              <InfoRow label="Tanggal Lahir" value={formatDate(patient.dateOfBirth)} />
              <InfoRow label="Pekerjaan" value={patient.occupation ?? '-'} />
              <InfoRow label="Telepon" value={data.phone ?? '-'} />
              <InfoRow label="Email" value={data.email ?? '-'} />
              <InfoRow label="Terapis" value={data.therapistName ?? '-'} />
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

            <div className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
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
        ) : activeTab === 'intake' ? (
          data.intake ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4">
                <div>
                  <p className="text-xs font-medium text-stone-500">Status intake</p>
                  <p className="text-sm font-bold text-[#181700]">{data.intake.status}</p>
                </div>
                <p className="text-xs text-stone-500">Dikirim {formatDate(data.intake.submittedAt)}</p>
              </div>
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
                <div key={label} className="rounded-2xl border border-stone-200/90 bg-white p-4">
                  <p className="text-xs font-medium text-stone-500">{label}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#181700]">{value || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
              <ClipboardList className="h-9 w-9 text-stone-300" />
              <p className="text-sm font-semibold text-[#181700]">Belum ada intake awal</p>
              <p className="max-w-sm text-xs text-stone-500">Form intake akan tampil di sini setelah pasien mengirimkannya.</p>
            </div>
          )
        ) : activeTab === 'assessment' ? (
          <div className="space-y-5">
            <p className="text-xs text-stone-500">{progress.length} catatan assessment</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="space-y-3">
                {progress.map((record) => (
                  <article key={record.id} className="rounded-2xl border border-stone-200/90 bg-white p-4">
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
            )}
          </div>
        ) : (
          <div className="space-y-5">
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
                {data.sessions.map((session) => (
                  <article key={session.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-4">
                    <div>
                      <p className="text-sm font-bold text-[#181700]">{formatDate(session.scheduledDate)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {session.startTime} • {session.durationMinutes} menit • {session.therapistName ?? '-'}
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
