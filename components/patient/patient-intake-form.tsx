'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { savePatientIntake, startNewPatientIntake } from '@/server/actions/patient-intakes';
import type { IntakeDraftInput } from '@/lib/validators/patient-intake';

type IntakeStatus = 'DRAFT' | 'NEEDS_REVISION' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'ARCHIVED';
type FieldName = keyof IntakeDraftInput;

type IntakeFormProps = {
  initialValues: Partial<IntakeDraftInput> | null;
  status: IntakeStatus | null;
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
  required = true,
  multiline = false,
  rows = 3,
  disabled,
  register,
  error,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled: boolean;
  register: ReturnType<typeof useForm<IntakeDraftInput>>['register'];
  error?: string;
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
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs sm:text-sm font-semibold text-[#1F2937]">
        {label}
        {required ? ' *' : ''}
      </Label>
      {multiline ? (
        <textarea
          id={name}
          rows={rows}
          disabled={disabled}
          className="flex min-h-[6rem] w-full resize-none rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] px-3.5 py-2.5 text-sm leading-relaxed text-[#1F2937] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[var(--hafta-ylw-400)] focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-400)]/20 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          {...field}
        />
      ) : (
        <Input
          id={name}
          disabled={disabled}
          className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] px-3.5 py-2 text-sm text-[#1F2937] focus-visible:border-[var(--hafta-ylw-400)] focus-visible:ring-2 focus-visible:ring-[var(--hafta-ylw-400)]/20 disabled:cursor-not-allowed disabled:opacity-60"
          {...field}
        />
      )}
      {error ? <p className="text-xs text-rose-600 font-medium">{error}</p> : null}
    </div>
  );
}

export function PatientIntakeForm({ initialValues, status }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const locked = status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'ACCEPTED' || status === 'ARCHIVED';
  const canStartNewVersion = status === 'ACCEPTED' || status === 'ARCHIVED';
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

  async function next() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleConfirmNewVersion() {
    startTransition(async () => {
      try {
        await startNewPatientIntake();
        router.refresh();
      } catch {
        setError('root', { message: 'Form Awal baru belum dapat dibuat.' });
        setShowConfirm(false);
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
          router.refresh();
        } catch {
          setError('root', { message: 'Form tidak dapat disimpan. Periksa seluruh isian lalu coba lagi.' });
        }
      }),
    );
  }

  return (
    <form className="space-y-6" onSubmit={save('submit')}>
      {status ? (
        <Alert className="border-[#E9E2D8] bg-[#FBF9F6] text-[#4B5563]">
          <AlertDescription className="flex items-center gap-2 text-sm">
            <span className="text-[#6B7280]">Status:</span>
            <strong className="font-semibold text-[#1F2937]">{statusLabel[status]}</strong>
            {locked ? <span className="text-[#6B7280]">· Form tidak dapat diubah sampai tim Hafta meminta perbaikan.</span> : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {errors.root ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}
      {canStartNewVersion ? (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending}
            onClick={startNewVersion}
            className="rounded-xl bg-[var(--hafta-ylw-400)] hover:bg-[var(--hafta-ylw-300)] text-white font-semibold"
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
        <nav aria-label="Tahap Form Awal" className="py-2">
          <ol className="relative flex w-full items-start">
            {steps.map((item, index) => {
              const isCompleted = index < step;
              const isCurrent = index === step;
              const isPassed = index <= step;

              return (
                <li key={item.title} className="flex flex-1 flex-col items-center last:flex-none">
                  {/* Row: circle + connector line */}
                  <div className="flex w-full items-center">
                    <button
                      type="button"
                      disabled={locked || index > step}
                      onClick={() => index <= step && setStep(index)}
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-[var(--hafta-ylw-400)] text-white shadow-sm'
                          : 'border border-[#E9E2D8] bg-white text-[#9CA3AF]'
                      } ${index <= step && !locked ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {index + 1}
                    </button>
                    {/* Connector line — only render between steps */}
                    {index < steps.length - 1 && (
                      <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-[#E9E2D8]">
                        <div
                          className={`absolute inset-0 bg-[var(--hafta-ylw-400)] transition-all duration-500 ease-out ${
                            isCompleted ? 'w-full' : 'w-0'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  {/* Label below the circle */}
                  <span
                    className={`mt-2 text-center text-xs font-medium ${
                      isCurrent ? 'text-[var(--hafta-ylw-400)]' : isCompleted ? 'text-[#1F2937]' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {/* Document View (locked) — compact read-only summary */}
      {locked ? (
        <div className="rounded-xl border border-[#E9E2D8] bg-white divide-y divide-[#E9E2D8] overflow-hidden">
          {/* Section: Keluhan Utama */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Keluhan Utama</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Keluhan utama</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('chiefComplaint') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Area yang dikeluhkan</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('affectedArea') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Awal keluhan</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('onsetDescription') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Pemicu</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('triggeringEvent') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>

          {/* Section: Aktivitas & Target */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Aktivitas & Target</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Keterbatasan aktivitas</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('dailyLimitations') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Target pasien</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('patientGoal') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Hal yang memperberat</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('aggravatingFactors') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Hal yang membantu meredakan</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('relievingFactors') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>

          {/* Section: Riwayat */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Riwayat Relevan</p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Riwayat cedera</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('previousInjuryHistory') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Riwayat operasi</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('surgeryHistory') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Riwayat medis relevan</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('relevantMedicalHistory') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Obat saat ini</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('currentMedication') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-0.5">Alergi</p>
                <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{getValues('allergies') || <span className="italic text-[#C4B9A8]">Tidak diisi</span>}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 0: Keluhan Utama (edit mode only) */}
      {step === 0 && !locked ? (
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1F2937]">Keluhan Utama</h2>
            <p className="text-sm text-[#6B7280]">
              Tuliskan dengan kata-kata Anda sendiri. Form ini bukan diagnosis.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="chiefComplaint"
              label="Keluhan utama"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.chiefComplaint?.message}
            />
            <TextField
              name="affectedArea"
              label="Area yang dikeluhkan"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.affectedArea?.message}
            />
            <TextField
              name="onsetDescription"
              label="Kapan atau bagaimana keluhan mulai terasa"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.onsetDescription?.message}
            />
            <TextField
              name="triggeringEvent"
              label="Kejadian atau aktivitas pemicu"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.triggeringEvent?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 1: Aktivitas & Target (edit mode only) */}
      {step === 1 && !locked ? (
        <section className="space-y-5 border-t border-[#E9E2D8] pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1F2937]">Aktivitas & Target</h2>
            <p className="text-sm text-[#6B7280]">Bantu tim memahami dampak keluhan pada aktivitas Anda.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="dailyLimitations"
              label="Keterbatasan aktivitas sehari-hari"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.dailyLimitations?.message}
            />
            <TextField
              name="patientGoal"
              label="Target yang ingin dicapai"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.patientGoal?.message}
            />
            <TextField
              name="aggravatingFactors"
              label="Hal yang memperberat keluhan"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.aggravatingFactors?.message}
            />
            <TextField
              name="relievingFactors"
              label="Hal yang membantu meredakan"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relievingFactors?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 2: Riwayat Relevan (edit mode only) */}
      {step === 2 && !locked ? (
        <section className="space-y-5 border-t border-[#E9E2D8] pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1F2937]">Riwayat Relevan</h2>
            <p className="text-sm text-[#6B7280]">Isi hanya informasi yang relevan dan Anda ketahui.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="previousInjuryHistory"
              label="Riwayat cedera sebelumnya"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.previousInjuryHistory?.message}
            />
            <TextField
              name="surgeryHistory"
              label="Riwayat operasi"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.surgeryHistory?.message}
            />
            <TextField
              name="relevantMedicalHistory"
              label="Riwayat medis yang relevan"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.relevantMedicalHistory?.message}
            />
            <TextField
              name="currentMedication"
              label="Obat yang sedang digunakan"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.currentMedication?.message}
            />
            <TextField
              name="allergies"
              label="Alergi yang diketahui"
              required
              multiline
              disabled={pending}
              register={register}
              error={errors.allergies?.message}
            />
          </div>
        </section>
      ) : null}

      {/* Step 3: Review & Kirim */}
      {step === 3 && !locked ? (
        <section className="space-y-5 border-t border-[#E9E2D8] pt-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1F2937]">Review & Kirim</h2>
            <p className="text-sm text-[#6B7280]">
              Setelah dikirim, Form Awal akan ditinjau tim Hafta dan tidak dapat diubah sampai diminta perbaikan.
            </p>
          </div>
          <div className="rounded-xl border border-[#E9E2D8] bg-[#FBF9F6] p-4 text-sm text-[#4B5563] space-y-2">
            <p>
              <strong className="text-[#1F2937]">Keluhan:</strong> {getValues('chiefComplaint') || 'Belum diisi'}
            </p>
            <p>
              <strong className="text-[#1F2937]">Area yang dikeluhkan:</strong> {getValues('affectedArea') || 'Belum diisi'}
            </p>
            <p>
              <strong className="text-[#1F2937]">Target Terapi:</strong> {getValues('patientGoal') || 'Belum diisi'}
            </p>
          </div>
          <div className="flex items-start align-middle gap-3 p-4 text-sm">
            <input
              id="dataAccuracyAcknowledged"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--hafta-ylw-400)] cursor-pointer"
              disabled={pending}
              {...register('dataAccuracyAcknowledged', { required: 'Konfirmasi ketepatan data diperlukan.' })}
            />
            <label htmlFor="dataAccuracyAcknowledged" className="select-none text-[#1F2937] cursor-pointer">
              Saya mengonfirmasi bahwa informasi yang saya kirimkan akurat sesuai pengetahuan saya.
            </label>
          </div>
          {errors.dataAccuracyAcknowledged ? (
            <p className="text-xs text-yellow-600 font-medium">{errors.dataAccuracyAcknowledged.message}</p>
          ) : null}
        </section>
      ) : null}

      {/* Action Buttons */}
      {!locked ? (
        <div className="flex flex-col-reverse gap-3 border-t border-[#E9E2D8] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep((current) => current - 1)}
                className="rounded-xl border border-[#E9E2D8] bg-white text-[#1F2937] hover:bg-[#FFF7ED]/50 hover:text-[var(--hafta-ylw-400)]"
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
              className="rounded-xl border border-[#E9E2D8] bg-white text-[#1F2937] hover:bg-[#FFF7ED]/50 hover:text-[var(--hafta-ylw-400)]"
            >
              Simpan Draft
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                disabled={pending}
                onClick={next}
                className="rounded-xl bg-[var(--hafta-ylw-400)] hover:bg-[var(--hafta-ylw-300)] text-white font-semibold shadow-xs"
              >
                Lanjut
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[var(--hafta-ylw-400)] hover:bg-[var(--hafta-ylw-300)] text-white font-semibold shadow-xs"
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
