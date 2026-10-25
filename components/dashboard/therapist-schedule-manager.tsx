'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarOff,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import {
  addTherapistTimeOff,
  deleteTherapistTimeOff,
  saveTherapistWeeklySchedule,
} from '@/server/actions/therapist-schedules';
import type { TherapistScheduleOverview } from '@/server/queries/therapist-schedules';

type DraftEntry = {
  key: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function TherapistScheduleManager({
  therapists,
  formId,
  onPendingChange,
}: {
  therapists: TherapistScheduleOverview[];
  formId: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState(therapists[0]?.therapistId ?? '');
  const selected = therapists.find((therapist) => therapist.therapistId === selectedId) ?? therapists[0];

  if (!selected) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-semibold text-[#181700]">Belum ada akun fisioterapis</p>
        <p className="mt-1 text-xs text-stone-500">Tambahkan pengguna dengan tipe akun THERAPIST terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <label className="block max-w-sm">
          <span className="text-xs font-semibold text-stone-500">Pilih fisioterapis</span>
          <div className="mt-1.5 relative w-full">
            <select
              value={selected.therapistId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-stone-200/90 bg-white pl-3 pr-10 text-sm font-semibold text-[#181700] focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30 disabled:opacity-60"
            >
              {therapists.map((therapist) => (
                <option key={therapist.therapistId} value={therapist.therapistId}>
                  {therapist.therapistName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          </div>
        </label>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Slot pasien hanya dihitung dari jam kerja yang tersimpan di sini, dikurangi appointment aktif,
          cuti, dan hari libur nasional.
        </p>
      </section>

      <TherapistScheduleEditor
        key={selected.therapistId}
        therapist={selected}
        formId={formId}
        onPendingChange={onPendingChange}
      />
    </div>
  );
}

export function TherapistScheduleEditor({
  therapist,
  formId,
  onPendingChange,
}: {
  therapist: TherapistScheduleOverview;
  formId: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DraftEntry[]>(() =>
    therapist.blocks.map((block) => ({
      key: block.id,
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime.slice(0, 5),
      endTime: block.endTime.slice(0, 5),
    })),
  );
  const [timeOffStart, setTimeOffStart] = useState('');
  const [timeOffEnd, setTimeOffEnd] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(pending);
  }, [onPendingChange, pending]);

  const grouped = useMemo(() => {
    const map = new Map<number, DraftEntry[]>();
    for (const day of DAYS) map.set(day.value, []);
    for (const entry of entries) {
      map.set(entry.dayOfWeek, [...(map.get(entry.dayOfWeek) ?? []), entry]);
    }
    return map;
  }, [entries]);

  function addBlock(dayOfWeek: number) {
    setEntries((current) => [
      ...current,
      { key: `new-${Date.now()}-${dayOfWeek}`, dayOfWeek, startTime: '09:00', endTime: '12:00' },
    ]);
  }

  function updateBlock(key: string, patch: Partial<Pick<DraftEntry, 'startTime' | 'endTime'>>) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  function removeBlock(key: string) {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  }

  function saveSchedule() {
    startTransition(async () => {
      try {
        await saveTherapistWeeklySchedule({
          therapistId: therapist.therapistId,
          entries: entries.map(({ dayOfWeek, startTime, endTime }) => ({
            dayOfWeek,
            startTime,
            endTime,
          })),
        });
        showToast('success', `Jam kerja ${therapist.therapistName} tersimpan.`);
        router.refresh();
      } catch (error) {
        showToast(
          'error',
          error instanceof Error && error.message && !error.message.includes('Zod')
            ? error.message
            : 'Jadwal kerja tidak valid. Periksa jam dan tumpang tindih antar blok.',
        );
      }
    });
  }

  function addTimeOff() {
    if (!timeOffStart || !timeOffEnd) {
      showToast('error', 'Tanggal mulai dan selesai wajib diisi.');
      return;
    }
    startTransition(async () => {
      try {
        await addTherapistTimeOff({
          therapistId: therapist.therapistId,
          startDate: timeOffStart,
          endDate: timeOffEnd,
          reason: timeOffReason,
        });
        showToast('success', 'Tanggal berhasil diblokir dari slot pasien.');
        setTimeOffStart('');
        setTimeOffEnd('');
        setTimeOffReason('');
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Blokir tanggal tidak dapat disimpan.');
      }
    });
  }

  function removeTimeOff(id: string) {
    startTransition(async () => {
      try {
        await deleteTherapistTimeOff(id);
        showToast('success', 'Blokir tanggal dihapus.');
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Blokir tanggal tidak dapat dihapus.');
      }
    });
  }

  return (
    <div className="space-y-6">
      {entries.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold">Belum ada jam kerja mingguan</p>
            <p className="leading-relaxed text-amber-900">
              Pasien belum dapat melihat tanggal sampai Anda menambahkan jam kerja per hari, lalu menekan
              tombol Simpan Jam Kerja.
            </p>
          </div>
        </div>
      ) : null}

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          saveSchedule();
        }}
      >
        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="border-b border-stone-200 pb-4">
          <h2 className="text-base font-bold text-[#181700]">Jam Kerja Mingguan</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Jam ini menjadi slot yang bisa dipilih pasien dan berlaku otomatis setiap minggu. Untuk
            tanggal tertentu yang tidak bisa melayani pasien, gunakan bagian Blokir Tanggal di bawah.
          </p>
        </div>

        <div className="mt-2 divide-y divide-stone-100">
          {DAYS.map((day) => {
            const dayEntries = grouped.get(day.value) ?? [];
            return (
              <div key={day.value} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#181700]">{day.label}</h3>
                  <button
                    type="button"
                    onClick={() => addBlock(day.value)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 px-3 text-[11px] font-semibold text-[#181700] hover:bg-[var(--hafta-ylw-50)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Jam
                  </button>
                </div>

                {dayEntries.length === 0 ? (
                  <p className="mt-2 text-xs text-stone-400">Tidak ada jadwal.</p>
                ) : (
                  <div className="mt-2.5 space-y-2">
                    {dayEntries.map((entry) => (
                      <div key={entry.key} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(event) => updateBlock(entry.key, { startTime: event.target.value })}
                          className="h-9 rounded-lg border border-stone-200 px-2.5 text-xs font-semibold text-[#181700] outline-none focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30"
                        />
                        <span className="text-xs text-stone-400">s.d.</span>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(event) => updateBlock(entry.key, { endTime: event.target.value })}
                          className="h-9 rounded-lg border border-stone-200 px-2.5 text-xs font-semibold text-[#181700] outline-none focus:outline-none focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeBlock(entry.key)}
                          aria-label={`Hapus jadwal ${day.label}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-[var(--hafta-red-50)] hover:text-[var(--hafta-red-700)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </section>
      </form>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 pt-2">
        <div className="border-b border-stone-200 pb-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#181700]">
            <CalendarOff className="h-4 w-4" />
            Blokir Tanggal (Cuti / Tidak Tersedia)
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Bagian ini hanya menutup tanggal dari slot pasien dan tidak menambah jam kerja. Pilih
            tanggal mulai dan selesai cuti, lalu tekan Blokir Tanggal.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
          <label className="block">
            <span className="text-[11px] font-semibold text-stone-500">Cuti mulai</span>
            <DatePicker
              value={timeOffStart}
              onChange={(value) => {
                setTimeOffStart(value);
                if (!timeOffEnd || timeOffEnd < value) setTimeOffEnd(value);
              }}
              placeholder="Pilih tanggal mulai"
              className="mt-1 h-10 w-full rounded-xl border-stone-200 bg-white text-sm text-[#181700]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-stone-500">Cuti selesai</span>
            <DatePicker
              value={timeOffEnd}
              onChange={(value) => setTimeOffEnd(timeOffStart && value < timeOffStart ? timeOffStart : value)}
              placeholder="Pilih tanggal selesai"
              className="mt-1 h-10 w-full rounded-xl border-stone-200 bg-white text-sm text-[#181700]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-stone-500">Keterangan (opsional)</span>
            <input
              type="text"
              value={timeOffReason}
              onChange={(event) => setTimeOffReason(event.target.value)}
              placeholder="Contoh: cuti tahunan"
              className="mt-1 h-10 w-full rounded-xl border border-stone-200 px-3 text-sm text-[#181700] outline-none focus:border-[var(--hafta-ylw-300)]"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={addTimeOff}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 px-4 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-ylw-50)] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Blokir Tanggal
          </button>
        </div>

        {therapist.timeOff.length > 0 ? (
          <div className="mt-4 divide-y divide-stone-100">
            {therapist.timeOff.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#181700]">
                    {formatDate(item.startDate)}
                    {item.endDate !== item.startDate ? ` – ${formatDate(item.endDate)}` : ''}
                  </p>
                  {item.reason ? <p className="mt-0.5 text-xs text-stone-500">{item.reason}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeTimeOff(item.id)}
                  aria-label="Hapus jadwal cuti"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-[var(--hafta-red-50)] hover:text-[var(--hafta-red-700)] disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-stone-400">Belum ada tanggal yang diblokir.</p>
        )}
      </section>
    </div>
  );
}
