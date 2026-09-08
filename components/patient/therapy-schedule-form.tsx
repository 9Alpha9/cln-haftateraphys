'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { updateTherapySchedule } from '@/server/actions/therapy-schedule';
import type { TherapyScheduleInput } from '@/lib/validators/therapy-schedule';

type Props = {
  patientId: string;
  initialValues: {
    nextTherapyAt: Date | null;
    therapyFrequencyText: string | null;
    therapyGoal: string | null;
    therapistNote: string | null;
  };
};

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function TherapyScheduleForm({ patientId, initialValues }: Props) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitSuccessful, isDirty },
    setError,
  } = useForm<TherapyScheduleInput>({
    defaultValues: {
      nextTherapyAt: formatDateForInput(initialValues.nextTherapyAt),
      therapyFrequencyText: initialValues.therapyFrequencyText ?? '',
      therapyGoal: initialValues.therapyGoal ?? '',
      therapistNote: initialValues.therapistNote ?? '',
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((data) =>
        startTransition(async () => {
          try {
            await updateTherapySchedule(patientId, data);
          } catch {
            setError('root', { message: 'Data jadwal terapi tidak dapat disimpan. Coba lagi.' });
          }
        }),
      )}
    >
      {isSubmitSuccessful && !isDirty ? (
        <Alert variant="success">
          <AlertDescription>Data jadwal terapi berhasil disimpan.</AlertDescription>
        </Alert>
      ) : null}
      {errors.root ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nextTherapyAt">Kunjungan Berikutnya</Label>
          <Controller
            control={control}
            name="nextTherapyAt"
            render={({ field }) => (
              <DatePicker
                id="nextTherapyAt"
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={pending}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="therapyFrequencyText">Frekuensi Terapi</Label>
          <Input
            id="therapyFrequencyText"
            placeholder="contoh: 2x seminggu"
            disabled={pending}
            {...register('therapyFrequencyText')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="therapyGoal">Tujuan Terapi</Label>
        <Input
          id="therapyGoal"
          placeholder="contoh: Peningkatan ROM sendi bahu"
          disabled={pending}
          {...register('therapyGoal')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="therapistNote">Catatan Terapis</Label>
        <textarea
          id="therapistNote"
          disabled={pending}
          placeholder="Catatan tindak lanjut, edukasi, atau instruksi khusus..."
          className="flex min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          {...register('therapistNote')}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" size="sm" disabled={pending || !isDirty}>
          {pending ? 'Menyimpan...' : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
