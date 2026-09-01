'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NumberInput } from '@/components/ui/number-input';
import { useToast } from '@/components/ui/toast';
import { saveTherapyProgress, finalizeTherapyProgress } from '@/server/actions/therapy-progress';

type PatientOption = { id: string; label: string };

export function TherapyProgressForm({ patientOptions }: { patientOptions: PatientOption[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function onSubmit(event: React.FormEvent<HTMLFormElement>, finalize: boolean) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await saveTherapyProgress({
          patientId: String(formData.get('patientId') ?? ''),
          painScore: Number(formData.get('painScore') ?? 0),
          rangeOfMotionScore: Number(formData.get('rangeOfMotionScore') ?? 0),
          strengthScore: Number(formData.get('strengthScore') ?? 0),
          functionScore: Number(formData.get('functionScore') ?? 0),
          summary: String(formData.get('summary') ?? ''),
          anamnesis: String(formData.get('anamnesis') ?? ''),
          physicalExamination: String(formData.get('physicalExamination') ?? ''),
          diagnosis: String(formData.get('diagnosis') ?? ''),
          treatment: String(formData.get('treatment') ?? ''),
          followUpPlan: String(formData.get('followUpPlan') ?? ''),
          patientVisible: Number(formData.get('patientVisible') ?? 0),
        });

        if (!result.ok) {
          showToast('error', result.error);
          return;
        }

        if (finalize) {
          const fin = await finalizeTherapyProgress(result.id);
          if (!fin.ok) {
            showToast('error', fin.error);
            return;
          }
          showToast('success', 'Evaluasi berhasil difinalisasi.');
        } else {
          showToast('success', 'Draft evaluasi berhasil disimpan.');
        }
        router.push('/dashboard/progress');
        router.refresh();
      } catch {
        showToast('error', 'Gagal menyimpan evaluasi.');
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        onSubmit(e, submitter?.value === 'finalize');
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patientId">Pasien</Label>
          <Select id="patientId" name="patientId" required disabled={pending || patientOptions.length === 0}>
            <option value="">Pilih pasien</option>
            {patientOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="painScore">Nyeri (0–10)</Label>
          <NumberInput id="painScore" name="painScore" min={0} max={10} required defaultValue={0} disabled={pending} />
          <p className="text-xs text-muted-foreground">0 = tidak nyeri, 10 = nyeri maksimal</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rangeOfMotionScore">ROM (0–10)</Label>
          <NumberInput id="rangeOfMotionScore" name="rangeOfMotionScore" min={0} max={10} required defaultValue={0} disabled={pending} />
          <p className="text-xs text-muted-foreground">0 = tidak ada gerakan, 10 = gerakan penuh</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="strengthScore">Kekuatan (0–10)</Label>
          <NumberInput id="strengthScore" name="strengthScore" min={0} max={10} required defaultValue={0} disabled={pending} />
          <p className="text-xs text-muted-foreground">0 = tidak ada kekuatan, 10 = kekuatan penuh</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="functionScore">Fungsi (0–10)</Label>
          <NumberInput id="functionScore" name="functionScore" min={0} max={10} required defaultValue={0} disabled={pending} />
          <p className="text-xs text-muted-foreground">0 = tidak berfungsi, 10 = fungsi penuh</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="anamnesis">Anamnesis</Label>
        <Textarea
          id="anamnesis"
          name="anamnesis"
          rows={4}
          placeholder="Keluhan utama dan riwayat penyakit..."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="physicalExamination">Pemeriksaan Fisik & Penunjang</Label>
        <Textarea
          id="physicalExamination"
          name="physicalExamination"
          rows={4}
          placeholder="Tanda vital, observasi klinis, ROM, kekuatan otot..."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          rows={4}
          placeholder="Kesimpulan medis/fisioterapi..."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="treatment">Pengobatan & Tindakan</Label>
        <Textarea
          id="treatment"
          name="treatment"
          rows={4}
          placeholder="Tindakan fisioterapi yang diberikan..."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="followUpPlan">Rencana Tindak Lanjut</Label>
        <Textarea
          id="followUpPlan"
          name="followUpPlan"
          rows={4}
          placeholder="Anjuran, jadwal kontrol, edukasi..."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Ringkasan Tambahan (opsional)</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={4}
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
        <input id="progressPatientVisible" type="checkbox" name="patientVisible" value={1} className="h-4 w-4 shrink-0 rounded border-input accent-[var(--accent)] cursor-pointer" />
        <span className="text-sm select-none">Tampilkan ke pasien</span>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Batal
        </Button>
        <Button type="submit" name="action" value="draft" variant="outline" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Draft'}
        </Button>
        <Button type="submit" name="action" value="finalize" disabled={pending}>
          {pending ? 'Memfinalisasi...' : 'Simpan & Finalisasi'}
        </Button>
      </div>
    </form>
  );
}
