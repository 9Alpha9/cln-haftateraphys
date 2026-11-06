'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ClipboardList, Eye, EyeOff, FilePenLine, Loader2, Lock, Save, Stethoscope, UserRound } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { AppSelect } from '@/components/ui/app-select';
import { useToast } from '@/components/ui/toast';
import {
  finalizeTherapyProgress,
  saveTherapyProgress,
  updateTherapyProgress,
} from '@/server/actions/therapy-progress';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

type PatientOption = { id: string; label: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  record?: TherapyProgressView | null;
  patientOptions: PatientOption[];
  defaultPatientId?: string;
  defaultAppointmentId?: string;
  defaultStatus?: 'DRAFT' | 'FINALIZED';
  onSaved?: () => void;
};

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] ring-1 ring-stone-200/80">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-[#181700]">{title}</h3>
        {description ? <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">{description}</p> : null}
      </div>
    </div>
  );
}

const SCORE_FIELDS = [
  { name: 'painScore', label: 'Nyeri (VAS)', hint: '0 = tidak nyeri, 10 = nyeri maksimal' },
  { name: 'rangeOfMotionScore', label: 'ROM', hint: '0 = tidak ada gerakan, 10 = gerakan penuh' },
  { name: 'strengthScore', label: 'Kekuatan', hint: '0 = tidak ada kekuatan, 10 = penuh' },
  { name: 'functionScore', label: 'Fungsi', hint: '0 = tidak berfungsi, 10 = fungsi penuh' },
] as const;

export function MedicalRecordFormDrawer({
  isOpen,
  onClose,
  record,
  patientOptions,
  defaultPatientId,
  defaultAppointmentId,
  defaultStatus = 'DRAFT',
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [canSubmit, setCanSubmit] = useState(
    Boolean(record ?? defaultPatientId ?? (patientOptions.length === 1 ? patientOptions[0].id : '')),
  );
  const formId = useId();

  function handleClose() {
    setIsSaving(false);
    onClose();
  }

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      icon={<Activity className="h-5 w-5" />}
      title={record ? (record.amendedFromId ? 'Edit Amandemen' : 'Edit Rekam Medis') : 'Tambah Rekam Medis'}
      subtitle={
        record
          ? `${record.patientName}${record.amendedFromId ? ` · Amandemen R${record.revisionNumber ?? 2}` : ''}`
          : 'Lengkapi indikator klinis dan catatan SOAP'
      }
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <button
            type="submit"
            form={formId}
            disabled={isSaving || !canSubmit}
            className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--hafta-ylw-100)]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            Batal
          </button>
        </div>
      }
    >
      {isOpen && (
        <MedicalRecordForm
          key={record?.id ?? `new-${defaultPatientId ?? 'record'}`}
          formId={formId}
          onPendingChange={setIsSaving}
          onPatientReadyChange={setCanSubmit}
          onClose={handleClose}
          record={record}
          patientOptions={patientOptions}
          defaultPatientId={defaultPatientId}
          defaultAppointmentId={defaultAppointmentId}
          defaultStatus={defaultStatus}
          onSaved={onSaved}
        />
      )}
    </GlobalSlideOver>
  );
}

function MedicalRecordForm({
  onClose,
  record,
  patientOptions,
  defaultPatientId,
  defaultAppointmentId,
  defaultStatus = 'DRAFT',
  onSaved,
  formId,
  onPendingChange,
  onPatientReadyChange,
}: Omit<Props, 'isOpen'> & {
  formId: string;
  onPendingChange?: (pending: boolean) => void;
  onPatientReadyChange?: (ready: boolean) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [scores, setScores] = useState({
    painScore: record?.painScore ?? 0,
    rangeOfMotionScore: record?.rangeOfMotionScore ?? 0,
    strengthScore: record?.strengthScore ?? 0,
    functionScore: record?.functionScore ?? 0,
  });
  const [status, setStatus] = useState<'DRAFT' | 'FINALIZED'>(record?.status ?? defaultStatus);
  const [patientVisible, setPatientVisible] = useState(record?.patientVisible ? '1' : '0');
  const [patientId, setPatientId] = useState(
    record?.patientId ?? defaultPatientId ?? (patientOptions.length === 1 ? patientOptions[0].id : ''),
  );
  const fieldsDisabled = pending || !patientId;

  useEffect(() => {
    onPendingChange?.(pending);
  }, [onPendingChange, pending]);

  useEffect(() => {
    onPatientReadyChange?.(Boolean(patientId));
  }, [onPatientReadyChange, patientId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedPatientId = record?.patientId ?? String(formData.get('patientId') ?? '');

    if (!selectedPatientId) {
      showToast('error', 'Pilih pasien terlebih dahulu.');
      return;
    }

    startTransition(async () => {
      const payload = {
        patientId: selectedPatientId,
        appointmentId: record ? undefined : defaultAppointmentId,
        painScore: scores.painScore,
        rangeOfMotionScore: scores.rangeOfMotionScore,
        strengthScore: scores.strengthScore,
        functionScore: scores.functionScore,
        anamnesis: String(formData.get('anamnesis') ?? ''),
        physicalExamination: String(formData.get('physicalExamination') ?? ''),
        medicalHistory: String(formData.get('medicalHistory') ?? ''),
        diagnosis: String(formData.get('diagnosis') ?? ''),
        treatment: String(formData.get('treatment') ?? ''),
        evaluation: String(formData.get('evaluation') ?? ''),
        followUpPlan: String(formData.get('followUpPlan') ?? ''),
        summary: String(formData.get('summary') ?? ''),
        patientVisible: Number(patientVisible),
      };

      if (record) {
        const result = await updateTherapyProgress({ ...payload, recordId: record.id, status });
        if (!result.ok) {
          showToast('error', result.error);
          return;
        }
        showToast('success', 'Rekam medis berhasil diperbarui.');
      } else {
        const result = await saveTherapyProgress(payload);
        if (!result.ok) {
          showToast('error', result.error);
          return;
        }
        if (status === 'FINALIZED') {
          const finalizeResult = await finalizeTherapyProgress(result.id);
          if (!finalizeResult.ok) {
            showToast('error', finalizeResult.error);
            return;
          }
        }
        showToast('success', status === 'FINALIZED' ? 'Evaluasi berhasil dibuat dan difinalisasi.' : 'Draft evaluasi berhasil dibuat.');
      }

      router.refresh();
      onSaved?.();
      onClose();
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {!record && (
          <div className="space-y-3">
            <SectionHeading
              icon={<UserRound className="h-3.5 w-3.5" />}
              title="Pasien"
              description="Evaluasi akan disimpan pada rekam medis pasien ini."
            />
            {patientOptions.length === 1 ? (
              <>
                <input type="hidden" name="patientId" value={patientOptions[0].id} />
                <div className="mt-3 flex h-10 items-center rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 text-sm font-semibold text-[#181700]">
                  {patientOptions[0].label}
                </div>
              </>
            ) : (
              <div className="mt-3">
                <AppSelect
                  id="medical-record-patient"
                  name="patientId"
                  value={patientId}
                  onChange={setPatientId}
                  placeholder="Pilih pasien"
                  disabled={pending}
                  required
                  options={patientOptions.map((patient) => ({ value: patient.id, label: patient.label }))}
                />
              </div>
            )}
          </div>
        )}

        <section className="space-y-3">
          <SectionHeading
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            title="Indikator Klinis"
            description="Nilai kondisi pasien pada sesi ini dari skala 0 sampai 10."
          />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SCORE_FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={field.name} className="text-xs font-semibold text-[#181700]">
                  {field.label}
                </label>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#181700] px-2 font-mono text-xs font-bold text-white">
                  {scores[field.name]}
                </span>
              </div>
              <input
                id={field.name}
                type="range"
                min={0}
                max={10}
                step={1}
                value={scores[field.name]}
                onChange={(event) =>
                  setScores((current) => ({ ...current, [field.name]: Number(event.target.value) }))
                }
                disabled={fieldsDisabled}
                className="mt-4 h-1.5 w-full cursor-pointer accent-[#181700] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-1 flex justify-between font-mono text-[9px] text-stone-400">
                <span>0</span>
                <span>10</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-stone-400">{field.hint}</p>
            </div>
          ))}
        </div>
        </section>

        <section className="space-y-3">
          <SectionHeading
            icon={<Lock className="h-3.5 w-3.5" />}
            title="Status & Visibilitas"
            description="Finalisasi mengunci rekam medis agar tidak dapat diubah. Ini berbeda dari status sesi 'Selesai' di menu Jadwal. Akses pasien hanya berlaku untuk rekam final yang dibagikan."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-stone-500">Status rekam</p>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
                {(['DRAFT', 'FINALIZED'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    disabled={fieldsDisabled}
                    className={
                      status === option
                        ? 'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#181700] text-xs font-bold text-white shadow-2xs'
                        : 'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-stone-500 transition-colors hover:text-[#181700]'
                    }
                  >
                    {option === 'DRAFT' ? <FilePenLine className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {option === 'DRAFT' ? 'Draft' : 'Final Terkunci'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed text-stone-500">
                Draft masih dapat diedit. Final Terkunci menyegel laporan dan tidak dapat diubah lagi.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-stone-500">Terlihat oleh</p>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
                {[
                  { value: '0', label: 'Internal', icon: EyeOff },
                  { value: '1', label: 'Pasien', icon: Eye },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPatientVisible(option.value)}
                      disabled={fieldsDisabled}
                      className={
                        patientVisible === option.value
                          ? 'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full bg-[#181700] text-xs font-bold text-white shadow-2xs'
                          : 'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full text-xs font-semibold text-stone-500 transition-colors hover:text-[#181700]'
                      }
                    >
                      <Icon className="h-3 w-3" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-stone-500">
                Internal hanya terlihat oleh terapis dan admin. Pasien menampilkan laporan final di portal pasien.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading
            icon={<ClipboardList className="h-3.5 w-3.5" />}
            title="Catatan SOAP"
            description="SOAP = Subjective (keluhan), Objective (pemeriksaan), Assessment (diagnosa/evaluasi), Plan (tindakan/rencana). Isi sesuai kondisi pasien."
          />
        {[
          { name: 'anamnesis', label: 'Anamnesa Fisioterapi', placeholder: 'Keluhan utama, riwayat, dan faktor pemicu...' },
          { name: 'physicalExamination', label: 'Pemeriksaan Fisik', placeholder: 'Tanda vital, palpasi, ROM, dan tes spesifik...' },
          { name: 'medicalHistory', label: 'Riwayat Penyakit', placeholder: 'Riwayat penyakit, cedera, operasi, obat, dan alergi...' },
          { name: 'diagnosis', label: 'Diagnosa', placeholder: 'Kesimpulan klinis dan diagnosis fisioterapi...' },
          { name: 'treatment', label: 'Terapi / Tindakan', placeholder: 'Modalitas, terapi manual, dan latihan yang diberikan...' },
          { name: 'evaluation', label: 'Evaluasi', placeholder: 'Perkembangan kondisi dan hasil evaluasi terapi...' },
          { name: 'followUpPlan', label: 'Keterangan / Rencana Tindak Lanjut', placeholder: 'Edukasi, HEP, dan jadwal kontrol berikutnya...' },
          { name: 'summary', label: 'Catatan Klinis', placeholder: 'Catatan klinis tambahan yang perlu diketahui...' },
        ].map((field) => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="text-xs font-semibold text-[#181700]">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={['anamnesis', 'physicalExamination', 'medicalHistory', 'summary'].includes(field.name) ? 4 : 3}
              defaultValue={record?.[field.name as keyof TherapyProgressView] as string | null | undefined ?? ''}
              placeholder={field.placeholder}
              disabled={fieldsDisabled}
              className="w-full resize-y rounded-xl border border-stone-200 bg-stone-50/40 px-3.5 py-3 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:bg-white focus:ring-4 focus:ring-[var(--hafta-ylw-100)]"
            />
          </div>
        ))}
        </section>
    </form>
  );
}
