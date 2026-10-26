'use client';

import { useState, useTransition, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { savePatientIntake, startNewPatientIntake } from '@/server/actions/patient-intakes';
import type { IntakeDraftInput } from '@/lib/validators/patient-intake';
import { AlertCircle, Info, ExternalLink } from 'lucide-react';
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
  { title: 'Keluhan', description: 'Informasi utama' },
  { title: 'Aktivitas', description: 'Dampak dan target' },
  { title: 'Riwayat', description: 'Informasi relevan' },
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
        {label}
        {required ? <span className="text-[var(--hafta-red-600)]"> *</span> : ''}
      </Label>
      {hint ? <p className="text-xs text-stone-500 leading-normal">{hint}</p> : null}
      {multiline ? (
        <textarea
          id={name}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex w-full resize-y overflow-y-auto min-h-[5.5rem] max-h-[24rem] rounded-2xl border border-stone-200/90 bg-[#FEFEF6] px-4 py-3 text-sm sm:text-base leading-relaxed text-[#181700] placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-[var(--hafta-ylw-400)] focus-visible:ring-3 focus-visible:ring-[var(--hafta-ylw-400)]/20 disabled:cursor-not-allowed disabled:opacity-60 transition-all scrollbar-thin",
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
            "h-12 rounded-2xl border border-stone-200/90 bg-[#FEFEF6] px-4 py-2.5 text-sm sm:text-base text-[#181700] focus-visible:border-[var(--hafta-ylw-400)] focus-visible:ring-3 focus-visible:ring-[var(--hafta-ylw-400)]/20 disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...field}
        />
      )}
      {error ? <p className="text-xs text-[var(--hafta-red-600)] font-semibold mt-1">{error}</p> : null}
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
      ...initialValues,
    },
  });

  const stepFields: FieldName[][] = [
    ['chiefComplaint', 'affectedArea', 'onsetDescription', 'triggeringEvent'],
    ['dailyLimitations', 'patientGoal', 'aggravatingFactors', 'relievingFactors'],
    ['previousInjuryHistory', 'surgeryHistory', 'relevantMedicalHistory', 'currentMedication', 'allergies'],
    ['dataAccuracyAcknowledged'],
  ];

  const [rootErrorDetail, setRootErrorDetail] = useState<{
    title: string;
    description: string;
    actionText?: string;
    actionHref?: string;
  } | null>(null);

  async function next() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
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
    return handleSubmit((data) =>
      startTransition(async () => {
        try {
          await savePatientIntake(data, mode);
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
      }),
    );
  }

  useEffect(() => {
    if (!onFooterChange) return;

    if (locked) {
      onFooterChange(null);
      return;
    }

    onFooterChange(
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <div>
          {step > 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep((current) => current - 1)}
              className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Kembali
            </button>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={save('draft')}
            className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 font-semibold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            Simpan Draft
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={pending}
              onClick={next}
              className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Lanjut
            </button>
          ) : (
            <button
              type="submit"
              form={formId}
              disabled={pending}
              className="w-full sm:w-auto h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
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
    <form id={formId} className="flex min-h-full flex-col gap-6" onSubmit={save('submit')}>
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--hafta-red-900)] border border-[var(--hafta-red-200)] shadow-2xs transition-colors hover:bg-[var(--hafta-red-100)]/50"
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
            className="rounded-xl bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-semibold"
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
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs',
                        isPassed
                          ? 'bg-[var(--hafta-ylw-100)] text-[#181700] ring-3 ring-[var(--hafta-ylw-100)]/30'
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
                          isCompleted ? 'bg-[var(--hafta-ylw-300)]' : 'bg-transparent'
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
          <div className="px-5 py-4">
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
          <div className="px-5 py-4">
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
          <div className="px-5 py-4">
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

      {/* Step 0: Keluhan Utama (edit mode only) */}
      {step === 0 && !locked ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#181700]">Keluhan Utama</h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Tuliskan dengan kata-kata Anda sendiri sesuai yang dirasakan. Form ini bukan diagnosis medis.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <TextField
              name="chiefComplaint"
              label="Keluhan Utama"
              hint="Ceritakan rasa nyeri, pegal, atau rasa tidak nyaman yang paling mengganggu Anda saat ini."
              placeholder="Contoh: Pinggang bawah terasa nyeri dan kaku, terutama saat bangun tidur atau setelah duduk lama..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.chiefComplaint?.message}
              className="text-[11px]"
            />
            <TextField
              name="affectedArea"
              label="Area Tubuh yang Dikeluhkan"
              hint="Sebutkan bagian tubuh mana saja yang mengalami keluhan."
              placeholder="Contoh: Punggung bawah, leher sebelah kanan, pundak..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.affectedArea?.message}
              className="text-[11px]"
            />
            <TextField
              name="onsetDescription"
              label="Kapan atau Bagaimana Keluhan Mulai Terasa"
              hint="Kira-kira sudah berapa lama keluhan ini dirasakan, dan apakah muncul tiba-tiba atau perlahan?"
              placeholder="Contoh: Sudah terasa sejak 3 bulan lalu, awalnya pegal biasa lalu semakin sering kambuh dalam sebulan terakhir..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.onsetDescription?.message}
              className="text-[11px]"
            />
            <TextField
              name="triggeringEvent"
              label="Kejadian atau Aktivitas Pemicu"
              hint="Apakah ada kejadian atau aktivitas tertentu saat keluhan pertama kali muncul?"
              placeholder="Contoh: Setelah mengangkat beban berat / duduk bekerja di depan laptop berjam-jam..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.triggeringEvent?.message}
              className="text-[11px]"
            />
          </div>
        </section>
      ) : null}

      {/* Step 1: Aktivitas & Target (edit mode only) */}
      {step === 1 && !locked ? (
        <section className="space-y-6 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#181700]">Aktivitas & Target Pemulihan</h2>
            <p className="text-xs sm:text-sm text-stone-500">Bantu tim fisioterapis memahami dampak keluhan pada kehidupan sehari-hari Anda.</p>
          </div>
          <div className="flex flex-col gap-5">
            <TextField
              name="dailyLimitations"
              label="Keterbatasan Aktivitas Sehari-hari"
              hint="Aktivitas apa saja yang terganggu atau sulit dilakukan akibat keluhan ini?"
              placeholder="Contoh: Sulit membungkuk saat memakai sepatu, tidak nyaman saat menyetir mobil, terganggu saat bekerja..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.dailyLimitations?.message}
              className="text-[11px]"
            />
            <TextField
              name="patientGoal"
              label="Target yang Ingin Dicapai"
              hint="Apa harapan atau tujuan utama Anda setelah mengikuti fisioterapi di Hafta?"
              placeholder="Contoh: Nyeri hilang tuntas, bisa duduk bekerja dengan nyaman, dan dapat berolahraga kembali tanpa sakit..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.patientGoal?.message}
              className="text-[11px]"
            />
            <TextField
              name="aggravatingFactors"
              label="Hal yang Memperberat Keluhan"
              hint="Posisi atau gerakan apa yang membuat rasa nyeri semakin bertambah?"
              placeholder="Contoh: Duduk lebih dari 30 menit, berdiri lama, posisi membungkuk, menaiki tangga..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.aggravatingFactors?.message}
              className="text-[11px]"
            />
            <TextField
              name="relievingFactors"
              label="Hal yang Membantu Meredakan"
              hint="Apa yang biasanya Anda lakukan untuk membuat rasa sakit berkurang atau lebih nyaman?"
              placeholder="Contoh: Berbaring telentang, kompres air hangat, istirahat jalan santai..."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relievingFactors?.message}
              className="text-[11px]"
            />
          </div>
        </section>
      ) : null}

      {/* Step 2: Riwayat Relevan (edit mode only) */}
      {step === 2 && !locked ? (
        <section className="space-y-6 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#181700]">Riwayat Kesehatan</h2>
            <p className="text-xs sm:text-sm text-stone-500">Isi informasi yang Anda ketahui. Jika tidak ada, Anda cukup menulis &quot;Tidak ada&quot;.</p>
          </div>
          <div className="flex flex-col gap-5">
            <TextField
              name="previousInjuryHistory"
              label="Riwayat Cedera Sebelumnya"
              hint="Pernahkah Anda mengalami patah tulang, keseleo, atau cedera serupa di masa lalu?"
              placeholder="Tuliskan jika pernah ada cedera, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.previousInjuryHistory?.message}
              className="text-[11px]"
            />
            <TextField
              name="surgeryHistory"
              label="Riwayat Operasi"
              hint="Pernahkah Anda menjalani tindakan operasi atau pembedahan?"
              placeholder="Tuliskan jenis operasi dan tahunnya jika ada, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.surgeryHistory?.message}
              className="text-[11px]"
            />
            <TextField
              name="relevantMedicalHistory"
              label="Riwayat Medis yang Relevan"
              hint="Apakah Anda memiliki riwayat diabetes, hipertensi, saraf, atau penyakit kronis lainnya?"
              placeholder="Tuliskan riwayat penyakit jika ada, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relevantMedicalHistory?.message}
              className="text-[11px]"
            />
            <TextField
              name="currentMedication"
              label="Obat yang Sedang Digunakan"
              hint="Apakah Anda sedang rutin mengonsumsi obat atau suplemen tertentu?"
              placeholder="Tuliskan nama obat yang rutin diminum jika ada, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.currentMedication?.message}
              className="text-[11px]"
            />
            <TextField
              name="allergies"
              label="Riwayat Alergi"
              hint="Apakah Anda memiliki alergi terhadap obat, plester medis, atau makanan tertentu?"
              placeholder="Tuliskan jika ada alergi, atau tulis &quot;Tidak ada&quot;."
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.allergies?.message}
              className="text-[11px]"
            />
          </div>
        </section>
      ) : null}

      {/* Step 3: Review & Kirim */}
      {step === 3 && !locked ? (
        <section className="space-y-5 border-t border-stone-200 pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#181700]">Review & Kirim</h2>
            <p className="text-sm text-stone-500">
              Setelah dikirim, Form Awal akan ditinjau tim Hafta. Anda masih dapat memperbarui jawaban selama proses peninjauan.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FEFEF6] p-4 text-sm text-stone-600 space-y-2">
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
          <div className="flex items-start align-middle gap-3 p-4 text-sm">
            <input
              id="dataAccuracyAcknowledged"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--hafta-ylw-200)] cursor-pointer"
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
        <div className="sticky bottom-0 z-10 mt-auto -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-stone-200 bg-[#FEFEF6] px-5 py-3.5 sm:-mx-6 sm:-mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep((current) => current - 1)}
                className="rounded-xl border border-stone-200 bg-white text-[#181700] hover:bg-[var(--hafta-ylw-50)] hover:text-[#181700]"
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
              className="rounded-xl border border-stone-200 bg-white text-[#181700] hover:bg-[var(--hafta-ylw-50)] hover:text-[#181700]"
            >
              Simpan Draft
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                disabled={pending}
                onClick={next}
                className="rounded-xl bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-semibold shadow-xs"
              >
                Lanjut
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-semibold shadow-xs"
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
