'use client';

import { useId, useState, useTransition } from 'react';
import {
  CalendarDays,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import { saveHomeProgram } from '@/server/actions/home-programs';
import type { HomeProgramView } from '@/server/queries/home-programs';
import { cn } from '@/lib/utils';

type ItemDraft = {
  key: string;
  name: string;
  instruction: string;
  sets: string;
  repetitions: string;
  durationSeconds: string;
  frequencyText: string;
  precaution: string;
};

function blankItem(): ItemDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    instruction: '',
    sets: '',
    repetitions: '',
    durationSeconds: '',
    frequencyText: '',
    precaution: '',
  };
}

function toDraftItems(program: HomeProgramView | null): ItemDraft[] {
  if (!program || program.items.length === 0) return [blankItem()];
  return program.items.map((item) => ({
    key: item.id,
    name: item.name,
    instruction: item.instruction,
    sets: item.sets?.toString() ?? '',
    repetitions: item.repetitions?.toString() ?? '',
    durationSeconds: item.durationSeconds?.toString() ?? '',
    frequencyText: item.frequencyText ?? '',
    precaution: item.precaution ?? '',
  }));
}

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function dosageText(item: HomeProgramView['items'][number]) {
  return [
    item.sets ? `${item.sets} set` : null,
    item.repetitions ? `${item.repetitions} repetisi` : null,
    item.durationSeconds ? `${item.durationSeconds} detik` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function HomeProgramPanel({
  patientId,
  patientName,
  initialProgram,
  canManage,
  onSaved,
}: {
  patientId: string;
  patientName: string;
  initialProgram: HomeProgramView | null;
  canManage: boolean;
  onSaved?: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const program = initialProgram;

  return (
    <>
      {!program ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white p-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
            <Dumbbell className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#181700]">Belum ada program latihan</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Susun latihan mandiri agar pasien dapat melanjutkan terapi di rumah.
          </p>
          {canManage ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Program Latihan
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-stone-200/70 bg-white p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--hafta-grn-700)]">
                    <Dumbbell className="h-3 w-3" />
                    {program.status === 'ACTIVE' ? 'Aktif' : program.status}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      program.patientVisible
                        ? 'bg-[#F4F4F1] text-stone-600'
                        : 'bg-amber-50 text-amber-800',
                    )}
                  >
                    {program.patientVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {program.patientVisible ? 'Terlihat pasien' : 'Internal'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  {program.startsAt || program.endsAt ? (
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(program.startsAt) ?? 'Tanpa tanggal mulai'}
                      {program.endsAt ? ` – ${formatDate(program.endsAt)}` : ''}
                    </span>
                  ) : (
                    'Tanpa batas tanggal'
                  )}
                </p>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stone-200/90 bg-white px-3 text-[11px] font-semibold text-[#181700] transition-colors hover:bg-stone-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Program
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            {program.items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-stone-200/70 bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#181700]">
                    {index + 1}. {item.name}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-600">
                  {item.instruction}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-600">
                  {dosageText(item) ? (
                    <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5">{dosageText(item)}</span>
                  ) : null}
                  {item.frequencyText ? (
                    <span className="rounded-full bg-[#F4F4F1] px-2 py-0.5">{item.frequencyText}</span>
                  ) : null}
                </div>
                {item.precaution ? (
                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    Perhatian: {item.precaution}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen ? (
        <HomeProgramForm
          key={program?.id ?? 'new'}
          patientId={patientId}
          patientName={patientName}
          program={program}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            onSaved?.();
          }}
        />
      ) : null}
    </>
  );
}

function HomeProgramForm({
  patientId,
  patientName,
  program,
  onClose,
  onSaved,
}: {
  patientId: string;
  patientName: string;
  program: HomeProgramView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<ItemDraft[]>(() => toDraftItems(program));
  const [startsAt, setStartsAt] = useState(
    program?.startsAt ? new Date(program.startsAt).toISOString().slice(0, 10) : '',
  );
  const [endsAt, setEndsAt] = useState(
    program?.endsAt ? new Date(program.endsAt).toISOString().slice(0, 10) : '',
  );
  const [patientVisible, setPatientVisible] = useState(program?.patientVisible ?? true);
  const [error, setError] = useState<string | null>(null);

  function updateItem(key: string, field: keyof ItemDraft, value: string) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (items.some((item) => !item.name.trim() || !item.instruction.trim())) {
      setError('Nama dan instruksi setiap latihan wajib diisi.');
      return;
    }

    const payloadItems = items.map((item) => ({
      name: item.name.trim(),
      instruction: item.instruction.trim(),
      sets: item.sets.trim() ? Number(item.sets) : null,
      repetitions: item.repetitions.trim() ? Number(item.repetitions) : null,
      durationSeconds: item.durationSeconds.trim() ? Number(item.durationSeconds) : null,
      frequencyText: item.frequencyText.trim() || null,
      precaution: item.precaution.trim() || null,
    }));

    startTransition(async () => {
      const result = await saveHomeProgram({
        patientId,
        patientVisible,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        items: payloadItems,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      showToast('success', 'Program latihan berhasil disimpan.');
      onSaved();
    });
  }

  return (
    <GlobalSlideOver
      isOpen
      onClose={onClose}
      size="lg"
      icon={<Dumbbell className="h-5 w-5" />}
      title={program ? 'Edit Program Latihan' : 'Buat Program Latihan'}
      subtitle={patientName}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-[13px]"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Program
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white px-4 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100 disabled:opacity-60 sm:h-11 sm:px-5 sm:text-[13px]"
          >
            Batal
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4 sm:space-y-5">
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-[#181700]">Pengaturan Program</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-600">Mulai</span>
              <DatePicker
                value={startsAt}
                onChange={setStartsAt}
                disablePast
                placeholder="Pilih tanggal mulai"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-600">Selesai</span>
              <DatePicker
                value={endsAt}
                onChange={setEndsAt}
                disablePast
                placeholder="Pilih tanggal selesai"
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500">Terlihat oleh</p>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
              {[
                { value: false, label: 'Internal', icon: EyeOff },
                { value: true, label: 'Pasien', icon: Eye },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setPatientVisible(option.value)}
                    className={cn(
                      'inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-full text-xs font-semibold transition-colors',
                      patientVisible === option.value
                        ? 'bg-[#181700] font-bold text-white'
                        : 'text-stone-500 hover:text-[#181700]',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#181700]">Daftar Latihan</h3>
            <span className="text-[11px] text-stone-500">{items.length} latihan</span>
          </div>

          {items.map((item, index) => (
            <div key={item.key} className="space-y-2.5 rounded-2xl border border-stone-200/80 bg-[#FBFBFA] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#181700]">Latihan {index + 1}</p>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Hapus latihan ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <Input
                value={item.name}
                onChange={(e) => updateItem(item.key, 'name', e.target.value)}
                placeholder="Nama latihan"
                required
              />
              <textarea
                value={item.instruction}
                onChange={(e) => updateItem(item.key, 'instruction', e.target.value)}
                rows={2}
                placeholder="Instruksi gerakan yang harus dilakukan pasien"
                required
                className="w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3 py-2.5 text-sm leading-relaxed text-[#181700] outline-none transition-colors placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-100)]"
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0}
                    value={item.sets}
                    onChange={(e) => updateItem(item.key, 'sets', e.target.value)}
                    placeholder="Set"
                    aria-label="Set"
                  />
                  <span className="text-[10px] text-stone-400">Jumlah set latihan</span>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0}
                    value={item.repetitions}
                    onChange={(e) => updateItem(item.key, 'repetitions', e.target.value)}
                    placeholder="Repetisi"
                    aria-label="Repetisi"
                  />
                  <span className="text-[10px] text-stone-400">Repetisi per set</span>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0}
                    value={item.durationSeconds}
                    onChange={(e) => updateItem(item.key, 'durationSeconds', e.target.value)}
                    placeholder="Detik"
                    aria-label="Durasi detik"
                  />
                  <span className="text-[10px] text-stone-400">Durasi gerakan</span>
                </div>
                <div className="space-y-1">
                  <Input
                    value={item.frequencyText}
                    onChange={(e) => updateItem(item.key, 'frequencyText', e.target.value)}
                    placeholder="Frekuensi"
                    aria-label="Frekuensi"
                  />
                  <span className="text-[10px] text-stone-400">Contoh: 3x sehari</span>
                </div>
              </div>
              <div className="space-y-1">
                <Input
                  value={item.precaution}
                  onChange={(e) => updateItem(item.key, 'precaution', e.target.value)}
                  placeholder="Perhatian / kontraindikasi (opsional)"
                />
                <span className="text-[10px] text-stone-400">Perhatian khusus bagi pasien saat melaksanakan latihan ini.</span>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setItems((current) => [...current, blankItem()])}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-stone-300 bg-white text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Latihan
          </button>
        </section>
      </form>
    </GlobalSlideOver>
  );
}
