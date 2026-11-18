'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ClipboardList, Eye, EyeOff, FilePenLine, ImagePlus, Loader2, Lock, Save, Stethoscope, Trash2, UserRound } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Progress } from '@/components/ui/progress';
import { AppSelect } from '@/components/ui/app-select';
import { useToast } from '@/components/ui/toast';
import {
  finalizeTherapyProgress,
  saveTherapyProgress,
  updateTherapyProgress,
} from '@/server/actions/therapy-progress';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import { uploadDocument, removeOwnDocument } from '@/server/actions/documents';
import {
  attachDocumentToRecord,
  fetchRecordAttachmentImages,
  fetchUnlinkedImages,
} from '@/server/actions/record-attachments';

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
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border/80">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p> : null}
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
            className="h-11 px-4 sm:px-5 rounded-full bg-[var(--hafta-300)] hover:bg-[var(--hafta-400)] text-foreground font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--hafta-300)]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="h-11 px-4 sm:px-5 rounded-full bg-card hover:bg-accent text-foreground border border-border font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // `file` terisi untuk lampiran yang menunggu rekam disimpan lebih dulu
  // (rekam baru belum punya id), `id` terisi setelah berhasil diunggah.
  const [attachments, setAttachments] = useState<
    Array<{ key: string; name: string; id?: string; file?: File }>
  >([]);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [unlinkedImages, setUnlinkedImages] = useState<
    Array<{ id: string; name: string; createdAt: Date }>
  >([]);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const fieldsDisabled = pending || uploading || !patientId;

  useEffect(() => {
    onPendingChange?.(pending || uploading);
  }, [onPendingChange, pending, uploading]);

  useEffect(() => {
    onPatientReadyChange?.(Boolean(patientId));
  }, [onPatientReadyChange, patientId]);

  // Tampilkan lampiran yang sudah tersimpan pada rekam ini agar terapis tahu
  // foto mana yang ikut tercetak di PDF.
  useEffect(() => {
    let active = true;
    if (!record?.id) return;
    void Promise.all([
      fetchRecordAttachmentImages(record.id),
      fetchUnlinkedImages(record.patientId),
    ])
      .then(([images, unlinked]) => {
        if (!active) return;
        if (images.length > 0) {
          setAttachments(images.map((image) => ({ key: image.id, name: image.name, id: image.id })));
        }
        setUnlinkedImages(unlinked);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [record?.id, record?.patientId]);

  /**
   * `@react-pdf/renderer` hanya dapat menyematkan PNG/JPEG, jadi WebP (yang
   * diizinkan saat unggah) dikonversi ke PNG di browser sebelum dikirim.
   */
  async function normalizeImageFile(file: File): Promise<File> {
    if (file.type !== 'image/webp') return file;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) return file;
      context.drawImage(bitmap, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.webp$/i, '.png'), { type: 'image/png' });
    } catch {
      return file;
    }
  }

  async function uploadFiles(files: File[], targetRecordId?: string): Promise<number> {
    let success = 0;
    for (const raw of files) {
      const file = await normalizeImageFile(raw);
      const payload = new FormData();
      payload.set('patientId', patientId);
      payload.set('documentType', 'EXAM_RESULT');
      if (targetRecordId) payload.set('recordId', targetRecordId);
      if (patientVisible === '1') payload.set('patientVisible', 'on');
      payload.set('file', file);
      const result = await uploadDocument(payload);
      if (result.ok) {
        success += 1;
        setAttachments((current) => [
          ...current,
          { key: result.documentId ?? `${raw.name}-${Date.now()}`, name: raw.name, id: result.documentId },
        ]);
      } else {
        showToast('error', result.error);
      }
    }
    return success;
  }

  async function handleAttachExisting(documentId: string) {
    if (!record?.id) return;
    setAttachingId(documentId);
    try {
      const result = await attachDocumentToRecord(documentId, record.id);
      if (!result.ok) {
        showToast('error', result.error);
        return;
      }
      const image = unlinkedImages.find((item) => item.id === documentId);
      setUnlinkedImages((current) => current.filter((item) => item.id !== documentId));
      if (image) {
        setAttachments((current) => [
          ...current,
          { key: image.id, name: image.name, id: image.id },
        ]);
      }
      showToast('success', 'Foto dilampirkan ke rekam medis ini.');
    } finally {
      setAttachingId(null);
    }
  }

  async function handleRemoveAttachment(key: string) {
    const target = attachments.find((item) => item.key === key);
    if (!target) return;

    if (!target.id) {
      setAttachments((current) => current.filter((item) => item.key !== key));
      return;
    }

    if (target.id) {
      setDeletingFileId(target.id);
      try {
        const result = await removeOwnDocument(target.id);
        if (!result.ok) {
          showToast('error', result.error);
          return;
        }
      } catch {
        showToast('error', 'Gagal menghapus foto.');
        return;
      } finally {
        setDeletingFileId(null);
      }
    }

    setAttachments((current) => current.filter((item) => item.key !== key));
    showToast('success', 'Foto dihapus.');
  }

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
        // Unggah lampiran yang ditahan ke rekam yang baru dibuat.
        const pendingFiles = attachments
          .filter((item) => item.file)
          .map((item) => item.file as File);
        if (pendingFiles.length > 0) {
          setAttachments((current) => current.filter((item) => !item.file));
          const uploaded = await uploadFiles(pendingFiles, result.id);
          if (uploaded > 0) {
            showToast('success', `${uploaded} foto dilampirkan pada rekam medis ini.`);
          }
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
            {patientOptions.length === 0 ? (
              <div className="mt-3 space-y-2">
                <div
                  aria-disabled="true"
                  className="flex h-11 w-full cursor-not-allowed items-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-sm text-stone-500"
                >
                  Belum ada pasien terhubung
                </div>
                <p className="rounded-xl border border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--hafta-org-900)]">
                  Rekam medis hanya bisa dibuat untuk pasien yang ditugaskan kepada Anda. Daftarkan
                  pasien baru atau minta admin menugaskan pasien terlebih dahulu melalui menu{' '}
                  <span className="font-semibold">Pasien</span>.
                </p>
                <Link
                  href="/dashboard/patients"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Buka menu Pasien
                </Link>
              </div>
            ) : patientOptions.length === 1 ? (
              <>
                <input type="hidden" name="patientId" value={patientOptions[0].id} />
                <div className="mt-3 flex h-10 items-center rounded-xl border border-border bg-[var(--hafta-50)]/60 px-3.5 text-sm font-semibold text-foreground">
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
                  emptyMessage="Belum ada pasien terhubung ke akun Anda."
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
                <label htmlFor={field.name} className="text-xs font-semibold text-foreground">
                  {field.label}
                </label>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--hafta-900)] px-2 font-mono text-xs font-bold text-white">
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
                className="mt-4 h-1.5 w-full cursor-pointer accent-[var(--hafta-900)] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{field.hint}</p>
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
              <p className="text-[11px] font-medium text-muted-foreground">Status rekam</p>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
                {(['DRAFT', 'FINALIZED'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    disabled={fieldsDisabled}
                    className={
                      status === option
                        ? 'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-900)] text-xs font-bold text-white'
                        : 'flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground'
                    }
                  >
                    {option === 'DRAFT' ? <FilePenLine className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {option === 'DRAFT' ? 'Draft' : 'Final Terkunci'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Draft masih dapat diedit. Final Terkunci menyegel laporan dan tidak dapat diubah lagi.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">Terlihat oleh</p>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
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
                          ? 'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full bg-[var(--hafta-900)] text-xs font-bold text-white'
                          : 'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground'
                      }
                    >
                      <Icon className="h-3 w-3" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Internal hanya terlihat oleh terapis dan admin. Pasien menampilkan laporan final di portal pasien.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading
            icon={<ImagePlus className="h-3.5 w-3.5" />}
            title="Foto Analisa / Hasil Pemeriksaan"
            description="Unggah CT Scan, X-Ray, USG, atau foto analisa lain. Gambar dilampirkan pada rekam medis ini dan otomatis muncul di PDF-nya. Pasien hanya melihatnya jika rekam ini dibagikan ke pasien."
          />
          <div className="rounded-2xl border border-dashed border-border bg-[var(--hafta-50)]/40 p-3.5">
            <label
              htmlFor="medical-record-attachments"
              className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl text-center transition-colors ${
                fieldsDisabled || !patientId
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:bg-[var(--hafta-50)]'
              }`}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {uploading ? 'Mengunggah foto…' : 'Pilih foto analisa'}
              </span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · maks. 10 MB per file</span>
            </label>
            {uploadProgress !== null ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Mengunggah foto…</span>
                  <span className="tabular-nums">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            ) : null}
            <input
              id="medical-record-attachments"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={fieldsDisabled || !patientId}
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (!patientId || files.length === 0) return;
                // Rekam baru belum punya id: lampiran ditahan dulu lalu diunggah
                // setelah rekam tersimpan agar terikat ke rekam yang tepat.
                if (!record?.id) {
                  setAttachments((current) => [
                    ...current,
                    ...files.map((file) => ({
                      key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      name: file.name,
                      file,
                    })),
                  ]);
                  showToast('success', 'Foto ditambahkan dan akan diunggah saat rekam disimpan.');
                  return;
                }

                setUploading(true);
                setUploadProgress(0);
                let simulated = 0;
                const progressTimer = window.setInterval(() => {
                  simulated = Math.min(90, simulated + Math.max(2, Math.round((92 - simulated) / 8)));
                  setUploadProgress(simulated);
                }, 220);
                let success = 0;
                try {
                  success = await uploadFiles(files, record.id);
                } finally {
                  window.clearInterval(progressTimer);
                  setUploadProgress(100);
                  window.setTimeout(() => setUploadProgress(null), 700);
                }
                setUploading(false);
                if (success > 0) {
                  showToast('success', `${success} foto berhasil dilampirkan pada rekam medis ini.`);
                }
              }}
              className="sr-only"
            />
            {!patientId ? (
              <p className="mt-2 text-center text-[10px] font-medium text-amber-700">
                Pilih pasien terlebih dahulu sebelum mengunggah foto.
              </p>
            ) : null}
            {attachments.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-border/60 pt-2">
                {attachments.map((file) => (
                  <li
                    key={file.key}
                    className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {file.id ? '✓' : '•'} {file.name}
                      {file.id ? '' : ' (disimpan bersama rekam)'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Hapus ${file.name}`}
                      title="Hapus foto"
                      disabled={deletingFileId === file.id}
                      onClick={() => void handleRemoveAttachment(file.key)}
                      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Foto dilampirkan ke rekam medis ini dan otomatis muncul pada PDF-nya. Untuk rekam final,
              lampiran tetap dapat dilihat tanpa mengubah isi SOAP.
            </p>
            {record?.id && unlinkedImages.length > 0 ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
                <p className="text-[10px] font-semibold text-amber-900">
                  Foto pasien yang belum terhubung ke rekam ini
                </p>
                <ul className="mt-1.5 space-y-1">
                  {unlinkedImages.map((image) => (
                    <li key={image.id} className="flex items-center gap-2 text-[10.5px] text-amber-900">
                      <span className="min-w-0 flex-1 truncate">{image.name}</span>
                      <button
                        type="button"
                        disabled={attachingId === image.id}
                        onClick={() => void handleAttachExisting(image.id)}
                        className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 text-[10px] font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {attachingId === image.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3 w-3" />
                        )}
                        Lampirkan
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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
            <label htmlFor={field.name} className="text-xs font-semibold text-foreground">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={['anamnesis', 'physicalExamination', 'medicalHistory', 'summary'].includes(field.name) ? 4 : 3}
              defaultValue={record?.[field.name as keyof TherapyProgressView] as string | null | undefined ?? ''}
              placeholder={field.placeholder}
              disabled={fieldsDisabled}
              className="w-full resize-y rounded-xl border border-border bg-[var(--hafta-50)]/40 px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--hafta-950)] focus:bg-card focus:ring-4 focus:ring-[var(--hafta-org-100)]"
            />
          </div>
        ))}
        </section>
    </form>
  );
}
