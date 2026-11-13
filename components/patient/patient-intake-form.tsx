'use client';

import { useState, useTransition, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { savePatientIntake, startNewPatientIntake } from '@/server/actions/patient-intakes';
import type { IntakeDraftInput } from '@/lib/validators/patient-intake';
import Link from 'next/link';
import { AlertCircle, ImagePlus, Info, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type IntakeStatus = 'DRAFT' | 'NEEDS_REVISION' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'ARCHIVED';
type FieldName = keyof IntakeDraftInput;

type IntakeFormProps = {
  initialValues: Partial<IntakeDraftInput> | null;
  status: IntakeStatus | null;
  onSaved?: (mode: 'draft' | 'submit') => void;
  showStartNewAction?: boolean;
  onFooterChange?: (node: React.ReactNode) => void;
  formId?: string;
};

const steps = [
  { title: 'Keluhan', description: 'Keluhan utama' },
  { title: 'RPS', description: 'Riwayat penyakit sekarang' },
  { title: 'RPD', description: 'Riwayat penyakit dahulu' },
  { title: 'Target', description: 'Target pemulihan' },
  { title: 'Review', description: 'Konfirmasi kirim' },
];

const statusLabel: Record<IntakeStatus, string> = {
  DRAFT: 'Draft',
  NEEDS_REVISION: 'Perlu Perbaikan',
  SUBMITTED: 'Terkirim',
  UNDER_REVIEW: 'Sedang Ditinjau',
  ACCEPTED: 'Diterima',
  ARCHIVED: 'Diarsipkan',
};

function TextField({
  name,
  label,
  hint,
  placeholder,
  required = true,
  multiline = false,
  rows = 3,
  disabled,
  register,
  error,
  className,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled: boolean;
  register: ReturnType<typeof useForm<IntakeDraftInput>>['register'];
  error?: string;
  className?: string;
}) {
  const field = register(
    name,
    required
      ? {
          required: `${label} wajib diisi.`,
          minLength: { value: name === 'affectedArea' ? 2 : 10, message: `${label} belum cukup lengkap.` },
        }
      : undefined,
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm sm:text-base font-bold text-[#181700]">
        <span>
          {label}
          {required ? <span className="text-[var(--hafta-red-600)]">*</span> : null}
        </span>
      </Label>
      {hint ? <p className="text-xs text-stone-500 leading-normal">{hint}</p> : null}
      {multiline ? (
        <textarea
          id={name}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex w-full resize-y overflow-y-auto min-h-[5.5rem] max-h-[24rem] rounded-2xl border border-stone-200/90 bg-[#FEFEF6] px-4 py-3 text-sm sm:text-base leading-relaxed text-[#181700] placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-[var(--hafta-org-400)] focus-visible:ring-3 focus-visible:ring-[var(--hafta-org-400)]/20 disabled:cursor-not-allowed disabled:opacity-60 transition-all scrollbar-thin",
            className
          )}
          {...field}
        />
      ) : (
        <Input
          id={name}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "h-12 rounded-2xl border border-stone-200/90 bg-[#FEFEF6] px-4 py-2.5 text-sm sm:text-base text-[#181700] focus-visible:border-[var(--hafta-org-400)] focus-visible:ring-3 focus-visible:ring-[var(--hafta-org-400)]/20 disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...field}
        />
      )}
      {error ? <p className="text-xs text-[var(--hafta-red-600)] font-semibold mt-1">{error}</p> : null}
    </div>
  );
}

type IntakePhoto = { name: string; type: string; size: number; data: string };

async function compressIntakePhoto(file: File): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const maxDimension = 1280;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!context) {
        resolve('');
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    image.src = url;
  });
}

function PhotoUploader({
  photos,
  onChange,
  disabled,
}: {
  photos: IntakePhoto[];
  onChange: (photos: IntakePhoto[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = Array.from(fileList);
    if (photos.length + files.length > 4) {
      setError('Maksimal 4 foto.');
      return;
    }
    setProcessing(true);
    const next = [...photos];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: hanya file gambar yang diperbolehkan.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name}: ukuran melebihi 5 MB.`);
        continue;
      }
      const data = await compressIntakePhoto(file);
      if (!data) {
        setError(`${file.name}: foto gagal diproses.`);
        continue;
      }
      next.push({ name: file.name, type: 'image/jpeg', size: file.size, data });
    }
    onChange(next);
    setProcessing(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[#181700] sm:text-base">
        Foto kondisi <span className="font-normal text-stone-500">(opsional)</span>
      </p>
      <p className="text-xs leading-relaxed text-stone-500">
        Unggah foto area keluhan bila membantu. Maksimal 4 foto, masing-masing tidak lebih dari 5 MB.
        Foto akan diteruskan ke fisioterapis.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={`${photo.name}-${index}`}
            className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[#FAFAF8]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.data} alt={photo.name} className="h-24 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, itemIndex) => itemIndex !== index))}
              disabled={disabled || processing}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
              aria-label={`Hapus foto ${photo.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < 4 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || processing}
            className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-stone-300 bg-white text-stone-500 transition-colors hover:border-[#181700] hover:text-[#181700] disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-semibold">
              {processing ? 'Memproses...' : 'Tambah foto'}
            </span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error ? (
        <p className="text-xs font-semibold text-[var(--hafta-red-600)]">{error}</p>
      ) : null}
    </div>
  );
}

export function PatientIntakeForm({
  initialValues,
  status,
  onSaved,
  showStartNewAction = true,
  onFooterChange,
  formId: formIdProp,
}: IntakeFormProps) {
  const generatedId = useId();
  const formId = formIdProp ?? `intake-form-${generatedId.replace(/:/g, '')}`;
  const [step, setStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const locked = status === 'ACCEPTED' || status === 'ARCHIVED';
  const canStartNewVersion = showStartNewAction && (status === 'ACCEPTED' || status === 'ARCHIVED');
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
    setError,
  } = useForm<IntakeDraftInput>({
    defaultValues: {
      chiefComplaint: '',
      affectedArea: '',
      onsetDescription: '',
      triggeringEvent: '',
      aggravatingFactors: '',
      relievingFactors: '',
      dailyLimitations: '',
      previousInjuryHistory: '',
      surgeryHistory: '',
      relevantMedicalHistory: '',
      currentMedication: '',
      allergies: '',
      patientGoal: '',
      dataAccuracyAcknowledged: false,
      privacyConsent: false,
      mediaConsent: false,
      ...initialValues,
    },
  });

  const stepFields: FieldName[][] = [
    ['chiefComplaint', 'affectedArea'],
    ['onsetDescription', 'triggeringEvent', 'dailyLimitations', 'aggravatingFactors', 'relievingFactors'],
    ['previousInjuryHistory', 'surgeryHistory', 'relevantMedicalHistory', 'currentMedication', 'allergies'],
    ['patientGoal'],
    ['dataAccuracyAcknowledged'],
  ];

  const [photos, setPhotos] = useState<IntakePhoto[]>(
    () => (initialValues?.photos as IntakePhoto[] | undefined) ?? [],
  );

  const [rootErrorDetail, setRootErrorDetail] = useState<{
    title: string;
    description: string;
    actionText?: string;
    actionHref?: string;
  } | null>(null);

  function scrollFormToTop() {
    window.requestAnimationFrame(() => {
      const form = document.getElementById(formId);
      let node: HTMLElement | null = form?.parentElement ?? null;
      while (node) {
        const style = window.getComputedStyle(node);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight
        ) {
          node.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        node = node.parentElement;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  async function next() {
    const valid = await trigger(stepFields[step]);
    if (valid) {
      setStep((current) => Math.min(current + 1, steps.length - 1));
      scrollFormToTop();
    }
  }

  function handleConfirmNewVersion() {
    startTransition(async () => {
      try {
        const res = await startNewPatientIntake();
        if (res.success) {
          setRootErrorDetail(null);
          router.refresh();
        } else {
          setShowConfirm(false);
          if (res.reason === 'ROLE_NOT_ALLOWED') {
            setRootErrorDetail({
              title: 'Akun Anda Saat Ini Bukan Sebagai Pasien',
              description:
                'Anda saat ini sedang login dengan akun Terapis/Staf. Pembuatan form awal baru hanya dapat dilakukan oleh akun dengan hak akses Pasien.',
              actionText: 'Keluar dan masuk dengan akun pasien',
              actionHref: '/login',
            });
          } else if (res.reason === 'STILL_IN_REVIEW') {
            setRootErrorDetail({
              title: 'Form Awal Sebelumnya Masih Ditinjau',
              description:
                'Form awal Anda saat ini masih dalam proses peninjauan oleh tim fisioterapis Hafta. Anda dapat mengisi form baru setelah form saat ini selesai ditinjau dan diterima.',
              actionText: 'Lihat status di riwayat form',
              actionHref: '/dashboard/history',
            });
          } else if (res.reason === 'HAS_ACTIVE_DRAFT') {
            setRootErrorDetail({
              title: 'Anda Masih Memiliki Form yang Belum Selesai',
              description:
                'Terdapat draf form awal yang belum dikirim. Silakan lengkapi dan kirimkan draf tersebut terlebih dahulu sebelum membuat versi baru.',
            });
          } else {
            setRootErrorDetail({
              title: 'Form Awal Baru Belum Dapat Dibuat',
              description:
                'Sistem sedang memproses data klinis Anda. Silakan muat ulang halaman atau hubungi admin klinik kami jika kendala berlanjut.',
              actionText: 'Hubungi WhatsApp Hafta Fisioterapi',
              actionHref: 'https://wa.me/6281232932872',
            });
          }
        }
      } catch {
        setShowConfirm(false);
        setRootErrorDetail({
          title: 'Kendala Koneksi atau Izin Akses',
          description:
            'Permintaan pembuatan form awal baru tidak dapat diproses saat ini. Pastikan Anda masuk sebagai akun pasien dan memiliki koneksi internet yang stabil.',
        });
      }
    });
  }

  function startNewVersion() {
    setShowConfirm(true);
  }

  function save(mode: 'draft' | 'submit') {
    return handleSubmit((data) => {
      if (mode === 'submit' && !data.privacyConsent) {
        setError('privacyConsent', {
          type: 'manual',
          message: 'Persetujuan pemrosesan data pasien diperlukan sebelum mengirim.',
        });
        setStep(4);
        scrollFormToTop();
        return;
      }
      startTransition(async () => {
        try {
          await savePatientIntake({ ...data, photos }, mode);
          setRootErrorDetail(null);
          router.refresh();
          onSaved?.(mode);
        } catch {
          setRootErrorDetail({
            title: 'Form Tidak Dapat Disimpan',
            description:
              'Terdapat isian yang belum lengkap atau sesi login Anda telah berakhir. Silakan periksa seluruh bagian bertanda bintang dan coba kembali.',
          });
        }
      });
    });
  }

  useEffect(() => {
    if (!onFooterChange) return;

    if (locked) {
      onFooterChange(null);
      return;
    }

    onFooterChange(
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-3 flex items-center gap-2 sm:order-none">
          {step > 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStep((current) => current - 1);
                scrollFormToTop();
              }}
              className="h-10 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-all hover:bg-stone-100 disabled:opacity-50 sm:h-11 sm:flex-none sm:px-5 sm:text-[13px]"
            >
              Kembali
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={save('draft')}
            className="h-10 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-all hover:bg-stone-100 disabled:opacity-50 sm:h-11 sm:flex-none sm:px-5 sm:text-[13px]"
          >
            Simpan Draft
          </button>
        </div>
        <div className="order-1 sm:order-none sm:shrink-0">
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={pending}
              onClick={next}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700] transition-all hover:bg-[var(--hafta-org-200)] disabled:opacity-50 sm:w-auto sm:px-6 sm:text-[13px]"
            >
              Lanjut
            </button>
          ) : (
            <button
              type="submit"
              form={formId}
              disabled={pending}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--hafta-org-100)] px-4 sm:px-5 text-xs font-bold text-[#181700] transition-all hover:bg-[var(--hafta-org-200)] disabled:opacity-50 sm:w-auto sm:px-6 sm:text-[13px]"
            >
              {pending ? 'Mengirim...' : 'Kirim untuk Ditinjau'}
            </button>
          )}
        </div>
      </div>
    );

    return () => {
      onFooterChange(null);
    };
  }, [onFooterChange, step, pending, locked, formId]);

  return (
    <form id={formId} className="flex min-h-full flex-col gap-4 sm:gap-6" onSubmit={save('submit')}>
      {status ? (
        <Alert className="border-stone-200/80 bg-[#FEFEF6] text-stone-700">
          <AlertDescription className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Status:</span>
            <strong className="font-semibold text-[#181700]">{statusLabel[status]}</strong>
            {locked ? <span className="text-stone-500">· Form tidak dapat diubah sampai tim Hafta meminta perbaikan.</span> : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Humanized Error Handle Box dengan Penjelasan & Tindakan Jelas */}
      {rootErrorDetail ? (
        <div className="rounded-2xl border border-[var(--hafta-red-200)] bg-[var(--hafta-red-50)]/70 p-4.5 sm:p-5 text-[var(--hafta-red-950)] transition-all duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--hafta-red-600)] mt-0.5" aria-hidden="true" />
            <div className="flex-1 space-y-1.5 text-sm">
              <h4 className="font-bold text-[var(--hafta-red-900)] leading-snug">
                {rootErrorDetail.title}
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--hafta-red-800)]/90">
                {rootErrorDetail.description}
              </p>
              {rootErrorDetail.actionHref && (
                <div className="pt-2">
                  <a
                    href={rootErrorDetail.actionHref}
                    target={rootErrorDetail.actionHref.startsWith('http') ? '_blank' : undefined}
                    rel={rootErrorDetail.actionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--hafta-red-900)] border border-[var(--hafta-red-200)] transition-colors hover:bg-[var(--hafta-red-100)]/50"
                  >
                    <span>{rootErrorDetail.actionText}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {canStartNewVersion ? (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending}
            onClick={startNewVersion}
            className="font-bold text-[#181700]"
          >
            {pending ? 'Membuat...' : 'Isi Form Awal Baru'}
          </Button>
          <ConfirmDialog
            isOpen={showConfirm}
            title="Isi Form Awal Baru?"
            description="Versi sebelumnya akan disimpan sebagai riwayat dan Anda akan mengisi form kosong yang baru."
            confirmLabel="Ya, Buat Baru"
            pending={pending}
            onConfirm={handleConfirmNewVersion}
            onCancel={() => setShowConfirm(false)}
          />
        </div>
      ) : null}

      {/* Stepper Wizard Bar */}
      {!locked ? (
        <nav aria-label="Tahap Form Awal" className="w-full py-2">
          <ol className="flex w-full items-center justify-between">
            {steps.map((item, index) => {
              const isCompleted = index < step;
              const isCurrent = index === step;
              const isPassed = index <= step;

              return (
                <li
                  key={item.title}
                  className={cn(
                    'relative flex items-center',
                    index < steps.length - 1 ? 'flex-1' : 'shrink-0'
                  )}
                >
                  {/* Step Circle & Label Button */}
                  <div className="flex flex-col items-center relative z-10">
                    <button
                      type="button"
                      disabled={locked || index > step}
                      onClick={() => index <= step && setStep(index)}
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                        isPassed
                          ? 'bg-[var(--hafta-org-100)] text-[#181700] ring-3 ring-[var(--hafta-org-100)]/30'
                          : 'border border-stone-200 bg-white text-stone-400 hover:border-stone-300',
                        index <= step && !locked ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                      )}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {index + 1}
                    </button>
                    <span
                      className={cn(
                        'mt-1.5 text-center text-xs font-semibold whitespace-nowrap',
                        isCurrent ? 'text-[#181700]' : isCompleted ? 'text-stone-700' : 'text-stone-400'
                      )}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Connector segment between steps */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 sm:mx-3 -mt-5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300 ease-out',
                          isCompleted ? 'bg-[var(--hafta-org-300)]' : 'bg-transparent'
                        )}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {/* Document View (locked) — compact read-only summary */}
      {locked ? (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200 overflow-hidden">
          {/* Section: Keluhan Utama */}
          <div className="px-4 sm:px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 mb-3">Keluhan Utama</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Keluhan utama</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('chiefComplaint') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Area yang dikeluhkan</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('affectedArea') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Awal keluhan</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('onsetDescription') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Pemicu</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('triggeringEvent') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>

          {/* Section: Aktivitas & Target */}
          <div className="px-4 sm:px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 mb-3">Aktivitas & Target</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Keterbatasan aktivitas</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('dailyLimitations') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Target pasien</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('patientGoal') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Hal yang memperberat</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('aggravatingFactors') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Hal yang membantu meredakan</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('relievingFactors') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>

          {/* Section: Riwayat */}
          <div className="px-4 sm:px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 mb-3">Riwayat Relevan</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Riwayat cedera</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('previousInjuryHistory') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Riwayat operasi</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('surgeryHistory') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Riwayat medis relevan</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('relevantMedicalHistory') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Obat saat ini</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('currentMedication') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Alergi</p>
                <p className="text-sm text-[#181700] leading-relaxed whitespace-pre-wrap">{getValues('allergies') || <span className="italic text-stone-400">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 0: Keluhan Utama */}
      {step === 0 && !locked ? (
        <section className="space-y-4 sm:space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700] sm:text-lg">Keluhan Utama</h2>
            <p className="text-xs leading-relaxed text-stone-500 sm:text-sm">
              Tuliskan dengan kata-kata Anda sendiri sesuai yang dirasakan. Form ini bukan diagnosis
              medis.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:gap-5">
            <TextField
              name="chiefComplaint"
              label="Keluhan utama"
              hint="Ceritakan rasa nyeri, pegal, atau rasa tidak nyaman yang paling mengganggu Anda saat ini."
              placeholder="Contoh: Nyeri dan kaku di punggung bawah sejak seminggu terakhir."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.chiefComplaint?.message}
            />
            <TextField
              name="affectedArea"
              label="Area yang dikeluhkan"
              hint="Sebutkan bagian tubuh mana saja yang mengalami keluhan."
              placeholder="Contoh: Punggung bawah, leher sebelah kanan, pundak..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.affectedArea?.message}
            />
            <PhotoUploader photos={photos} onChange={setPhotos} disabled={pending} />
          </div>
        </section>
      ) : null}

      {/* Step 1: Riwayat Penyakit Sekarang */}
      {step === 1 && !locked ? (
        <section className="space-y-4 sm:space-y-5 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700] sm:text-lg">
              Riwayat Penyakit Sekarang (RPS)
            </h2>
            <p className="text-xs leading-relaxed text-stone-500 sm:text-sm">
              Jelaskan bagaimana keluhan berkembang dan apa yang memengaruhi rasa nyeri Anda.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:gap-5">
            <TextField
              name="onsetDescription"
              label="Kapan dan bagaimana keluhan mulai terasa"
              hint="Sudah berapa lama keluhan dirasakan, dan apakah muncul tiba-tiba atau perlahan?"
              placeholder="Contoh: Sejak 3 bulan lalu, awalnya pegal biasa lalu semakin sering kambuh..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.onsetDescription?.message}
            />
            <TextField
              name="triggeringEvent"
              label="Aktivitas pemicu rasa nyeri"
              hint="Aktivitas atau kejadian apa yang memicu keluhan muncul?"
              placeholder="Contoh: Setelah mengangkat beban berat / duduk lama di depan laptop..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.triggeringEvent?.message}
            />
            <TextField
              name="dailyLimitations"
              label="Keterbatasan aktivitas sehari-hari"
              hint="Aktivitas apa saja yang terganggu atau sulit dilakukan akibat keluhan ini?"
              placeholder="Contoh: Sulit membungkuk, tidak nyaman saat menyetir, terganggu saat bekerja..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.dailyLimitations?.message}
            />
            <TextField
              name="aggravatingFactors"
              label="Hal yang memperlambat keluhan"
              hint="Posisi atau gerakan apa yang membuat rasa nyeri bertambah?"
              placeholder="Contoh: Duduk lebih dari 30 menit, berdiri lama, membungkuk, menaiki tangga..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.aggravatingFactors?.message}
            />
            <TextField
              name="relievingFactors"
              label="Hal yang memperingan keluhan"
              hint="Apa yang biasanya membuat rasa sakit berkurang atau lebih nyaman?"
              placeholder="Contoh: Berbaring telentang, kompres hangat, istirahat..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relievingFactors?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 2: Riwayat Penyakit Dahulu */}
      {step === 2 && !locked ? (
        <section className="space-y-4 sm:space-y-5 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700] sm:text-lg">
              Riwayat Penyakit Dahulu (RPD)
            </h2>
            <p className="text-xs leading-relaxed text-stone-500 sm:text-sm">
              Riwayat relevan. Jika tidak ada, cukup tulis &quot;Tidak ada&quot;.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:gap-5">
            <TextField
              name="previousInjuryHistory"
              label="Riwayat keluhan di bagian yang sama"
              hint="Pernahkah Anda mengalami keluhan atau cedera serupa di area tersebut?"
              placeholder="Tuliskan jika pernah, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.previousInjuryHistory?.message}
            />
            <TextField
              name="surgeryHistory"
              label="Penanganan riwayat penyakit dahulu"
              hint="Pernahkah Anda menjalani operasi, terapi, atau penanganan medis sebelumnya?"
              placeholder="Tuliskan jenis penanganan dan tahunnya, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.surgeryHistory?.message}
            />
            <TextField
              name="allergies"
              label="Alergi yang diketahui"
              hint="Apakah Anda memiliki alergi terhadap obat, plester medis, atau makanan tertentu?"
              placeholder="Tuliskan jika ada alergi, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.allergies?.message}
            />
            <TextField
              name="relevantMedicalHistory"
              label="Riwayat medis lain yang relevan"
              hint="Apakah Anda memiliki riwayat diabetes, hipertensi, atau penyakit kronis lainnya?"
              placeholder="Tuliskan riwayat penyakit jika ada, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relevantMedicalHistory?.message}
            />
            <TextField
              name="currentMedication"
              label="Obat yang sedang digunakan"
              hint="Apakah Anda sedang rutin mengonsumsi obat atau suplemen tertentu?"
              placeholder="Tuliskan nama obat yang rutin diminum, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.currentMedication?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 3: Target Pemulihan */}
      {step === 3 && !locked ? (
        <section className="space-y-4 sm:space-y-5 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700] sm:text-lg">Target Pemulihan</h2>
            <p className="text-xs leading-relaxed text-stone-500 sm:text-sm">
              Bantu tim fisioterapis memahami hasil yang ingin Anda capai.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:gap-5">
            <TextField
              name="patientGoal"
              label="Target yang ingin dicapai"
              hint="Apa harapan atau tujuan utama Anda setelah mengikuti fisioterapi di Hafta?"
              placeholder="Contoh: Nyeri hilang, bisa duduk bekerja dengan nyaman, dan berolahraga kembali..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.patientGoal?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 4: Review & Kirim */}
      {step === 4 && !locked ? (
        <section className="space-y-4 sm:space-y-5 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700]">Review & Kirim</h2>
            <p className="text-sm text-stone-500">
              Setelah dikirim, Form Awal akan ditinjau tim Hafta. Anda masih dapat memperbarui jawaban selama proses peninjauan.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FEFEF6] p-3 sm:p-4 text-sm text-stone-600 space-y-2">
            <p>
              <strong className="text-[#181700]">Keluhan:</strong> {getValues('chiefComplaint') || 'Belum diisi'}
            </p>
            <p>
              <strong className="text-[#181700]">Area yang dikeluhkan:</strong> {getValues('affectedArea') || 'Belum diisi'}
            </p>
            <p>
              <strong className="text-[#181700]">Target Terapi:</strong> {getValues('patientGoal') || 'Belum diisi'}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:p-4 text-sm">
            <input
              id="privacyConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--hafta-org-200)] cursor-pointer"
              disabled={pending}
              {...register('privacyConsent')}
            />
            <label htmlFor="privacyConsent" className="select-none text-[#181700] cursor-pointer">
              Saya menyetujui pemrosesan data pasien sesuai{' '}
              <Link href="/privacy" className="font-semibold underline underline-offset-2">
                Kebijakan Privasi
              </Link>{' '}
              dan{' '}
              <Link href="/terms" className="font-semibold underline underline-offset-2">
                Syarat &amp; Ketentuan
              </Link>{' '}
              Hafta Fisioterapi. <span className="text-red-600">*</span>
            </label>
          </div>
          {errors.privacyConsent ? (
            <p className="text-xs text-[var(--hafta-red-600)] font-medium">
              {errors.privacyConsent.message}
            </p>
          ) : null}

          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:p-4 text-sm">
            <input
              id="mediaConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--hafta-org-200)] cursor-pointer"
              disabled={pending}
              {...register('mediaConsent')}
            />
            <label htmlFor="mediaConsent" className="select-none text-[#181700] cursor-pointer">
              Saya mengizinkan publikasi media (foto/video) untuk dokumentasi dan edukasi Hafta.
              Opsional dan terpisah dari persetujuan layanan.
            </label>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:p-4 text-sm">
            <input
              id="dataAccuracyAcknowledged"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--hafta-org-200)] cursor-pointer"
              disabled={pending}
              {...register('dataAccuracyAcknowledged', { required: 'Konfirmasi ketepatan data diperlukan.' })}
            />
            <label htmlFor="dataAccuracyAcknowledged" className="select-none text-[#181700] cursor-pointer">
              Saya mengonfirmasi bahwa informasi yang saya kirimkan akurat sesuai pengetahuan saya.
            </label>
          </div>
          {errors.dataAccuracyAcknowledged ? (
            <p className="text-xs text-[var(--hafta-red-600)] font-medium">{errors.dataAccuracyAcknowledged.message}</p>
          ) : null}
        </section>
      ) : null}

      {/* Action Buttons (Render inline only when drawer footer is not used) */}
      {!locked && !onFooterChange ? (
        <div className="sticky bottom-0 z-10 mt-auto -mx-3.5 -mb-3.5 flex flex-col-reverse gap-3 border-t border-stone-200 bg-[#FEFEF6] px-3.5 py-3.5 sm:-mx-5 sm:-mb-5 sm:px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                setStep((current) => current - 1);
                scrollFormToTop();
              }}
                className="border border-stone-200 bg-white font-semibold text-[#181700] hover:bg-stone-50 hover:text-[#181700]"
              >
                Kembali
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={save('draft')}
              className="border border-stone-200 bg-white font-semibold text-[#181700] hover:bg-stone-50 hover:text-[#181700]"
            >
              Simpan Draft
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                disabled={pending}
                onClick={next}
              >
                Lanjut
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
              >
                {pending ? 'Mengirim...' : 'Kirim untuk Ditinjau'}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
