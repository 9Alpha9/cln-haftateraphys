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
  disabled,
  register,
  error,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  multiline?: boolean;
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
      <Label htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </Label>
      {multiline ? (
        <textarea
          id={name}
          disabled={disabled}
          className="flex min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          {...field}
        />
      ) : (
        <Input id={name} disabled={disabled} {...field} />
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
        <Alert>
          <AlertDescription>
            Status Form Awal: <strong>{statusLabel[status]}</strong>
            {locked ? '. Form tidak dapat diubah sampai tim Hafta meminta perbaikan.' : '.'}
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
          <Button type="button" disabled={pending} onClick={startNewVersion}>
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
      {!locked ? (
        <ol className="relative grid grid-cols-4 gap-2" aria-label="Tahap Form Awal">
          <div aria-hidden="true" className="absolute left-0 right-0 top-4 h-0.5 bg-muted" />
          <div
            aria-hidden="true"
            className="absolute left-0 top-4 h-0.5 bg-primary transition-[width] duration-200"
            style={{ width: `${((step + 0.5) / steps.length) * 100}%` }}
          />
          {steps.map((item, index) => (
            <li key={item.title} className="relative min-w-0">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {index + 1}
              </div>
              <p
                className={`mt-2 truncate text-xs font-semibold ${index === step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {item.title}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
      {step === 0 || locked ? (
        <section className={locked ? 'space-y-5' : 'space-y-5'}>
          <div className="space-y-1">
            <h2 className="text-base font-semibold leading-7 text-foreground">Keluhan Utama</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Tuliskan dengan kata-kata Anda sendiri. Form ini bukan diagnosis.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="chiefComplaint"
              label="Keluhan utama"
              required
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.chiefComplaint?.message}
            />
            <TextField
              name="affectedArea"
              label="Area yang dikeluhkan"
              required
              disabled={locked || pending}
              register={register}
              error={errors.affectedArea?.message}
            />
            <TextField
              name="onsetDescription"
              label="Kapan atau bagaimana keluhan mulai terasa"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.onsetDescription?.message}
            />
            <TextField
              name="triggeringEvent"
              label="Kejadian atau aktivitas pemicu"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.triggeringEvent?.message}
            />
          </div>
        </section>
      ) : null}
      {step === 1 || locked ? (
        <section className="space-y-5 border-t border-border pt-6">
          <div>
            <h2 className="font-semibold text-foreground">Aktivitas & Target</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bantu tim memahami dampak keluhan pada aktivitas Anda.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="dailyLimitations"
              label="Keterbatasan aktivitas sehari-hari"
              required
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.dailyLimitations?.message}
            />
            <TextField
              name="patientGoal"
              label="Target yang ingin dicapai"
              required
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.patientGoal?.message}
            />
            <TextField
              name="aggravatingFactors"
              label="Hal yang memperberat keluhan"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.aggravatingFactors?.message}
            />
            <TextField
              name="relievingFactors"
              label="Hal yang membantu meredakan"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.relievingFactors?.message}
            />
          </div>
        </section>
      ) : null}
      {step === 2 || locked ? (
        <section className="space-y-5 border-t border-border pt-6">
          <div>
            <h2 className="font-semibold text-foreground">Riwayat Relevan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Isi hanya informasi yang relevan dan Anda ketahui.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="previousInjuryHistory"
              label="Riwayat cedera sebelumnya"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.previousInjuryHistory?.message}
            />
            <TextField
              name="surgeryHistory"
              label="Riwayat operasi"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.surgeryHistory?.message}
            />
            <TextField
              name="relevantMedicalHistory"
              label="Riwayat medis yang relevan"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.relevantMedicalHistory?.message}
            />
            <TextField
              name="currentMedication"
              label="Obat yang sedang digunakan"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.currentMedication?.message}
            />
            <TextField
              name="allergies"
              label="Alergi yang diketahui"
              multiline
              disabled={locked || pending}
              register={register}
              error={errors.allergies?.message}
            />
          </div>
        </section>
      ) : null}

      {step === 3 && !locked ? (
        <section className="space-y-5 border-t border-border pt-6">
          <div>
            <h2 className="font-semibold text-foreground">Review & Kirim</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Setelah dikirim, Form Awal akan ditinjau tim Hafta dan tidak dapat diubah sampai diminta perbaikan.
            </p>
          </div>
          <div className="rounded-lg bg-surface p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Keluhan:</strong> {getValues('chiefComplaint') || 'Belum diisi'}
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Target:</strong> {getValues('patientGoal') || 'Belum diisi'}
            </p>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              disabled={pending}
              {...register('dataAccuracyAcknowledged', { required: 'Konfirmasi ketepatan data diperlukan.' })}
            />
            <span>Saya mengonfirmasi bahwa informasi yang saya kirimkan akurat sesuai pengetahuan saya.</span>
          </label>
          {errors.dataAccuracyAcknowledged ? (
            <p className="text-sm text-destructive">{errors.dataAccuracyAcknowledged.message}</p>
          ) : null}
        </section>
      ) : null}

      {!locked ? (
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep((current) => current - 1)}
              >
                Kembali
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" disabled={pending} onClick={save('draft')}>
              Simpan Draft
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" disabled={pending} onClick={next}>
                Lanjut
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? 'Mengirim...' : 'Kirim untuk Ditinjau'}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
