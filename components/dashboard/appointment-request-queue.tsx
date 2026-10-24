'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Check, ChevronRight, Loader2, X } from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { useToast } from '@/components/ui/toast';
import { reviewPatientAppointmentRequest } from '@/server/actions/appointment-requests';
import type { PendingAppointmentRequest } from '@/server/queries/patient-portal';

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function AppointmentRequestQueue({ requests }: { requests: PendingAppointmentRequest[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<PendingAppointmentRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [pendingAction, setPendingAction] = useState<'approve' | 'decline' | null>(null);
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  function submit(action: 'approve' | 'decline') {
    if (!selected) return;
    setPendingAction(action);
    startTransition(async () => {
      try {
        await reviewPatientAppointmentRequest({
          requestId: selected.id,
          action,
          reviewNote,
        });
        showToast(
          'success',
          action === 'approve'
            ? 'Pengajuan disetujui dan jadwal pasien dibuat.'
            : 'Pengajuan ditolak dan pasien telah diberi tahu.',
        );
        setSelected(null);
        setReviewNote('');
        router.refresh();
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : 'Pengajuan tidak dapat diproses.');
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/35 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#181700] ring-1 ring-[var(--hafta-ylw-200)]">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#181700]">Pengajuan Jadwal Pasien</h2>
            <p className="text-xs text-stone-500">Tinjau permintaan slot sebelum membuat jadwal.</p>
          </div>
        </div>
        <span className="rounded-full bg-[#181700] px-3 py-1 text-[11px] font-semibold text-white">
          {requests.length} menunggu
        </span>
      </div>

      <div className="mt-4 divide-y divide-[var(--hafta-ylw-200)]/60 bg-white/70 px-4 sm:rounded-2xl">
        {requests.map((request) => (
          <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#181700]">{request.patientName}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {formatDate(request.requestedDate)} · {request.startTime} ({request.durationMinutes} menit)
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                Fisioterapis: {request.therapistName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(request);
                setReviewNote('');
              }}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-xs font-semibold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-50)]"
            >
              Tinjau
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <GlobalSlideOver
        isOpen={selected !== null}
        onClose={() => {
          if (!isPending) setSelected(null);
        }}
        size="md"
        icon={<CalendarClock className="h-5 w-5" />}
        title="Tinjau Pengajuan Jadwal"
        subtitle={selected ? `${selected.patientName} · ${formatDate(selected.requestedDate)}` : undefined}
        footer={
          selected ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => submit('decline')}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--hafta-red-200)] bg-white px-5 text-xs font-semibold text-[var(--hafta-red-700)] transition-colors hover:bg-[var(--hafta-red-50)] disabled:opacity-60"
                >
                  {isPending && pendingAction === 'decline' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Tolak
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => submit('approve')}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-ylw-100)] px-5 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-ylw-200)] disabled:opacity-60"
                >
                  {isPending && pendingAction === 'approve' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Setujui &amp; Buat Jadwal
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className="space-y-5">
            <dl className="divide-y divide-stone-100 text-sm">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-xs text-stone-500">Pasien</dt>
                <dd className="text-right font-semibold text-[#181700]">{selected.patientName}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-xs text-stone-500">Tanggal</dt>
                <dd className="text-right font-semibold text-[#181700]">{formatDate(selected.requestedDate)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-xs text-stone-500">Waktu</dt>
                <dd className="text-right font-semibold text-[#181700]">
                  {selected.startTime} · {selected.durationMinutes} menit
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-xs text-stone-500">Fisioterapis</dt>
                <dd className="text-right font-semibold text-[#181700]">{selected.therapistName}</dd>
              </div>
            </dl>

            {selected.patientNote ? (
              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-[11px] font-semibold text-stone-500">Catatan pasien</p>
                <p className="mt-1 text-sm leading-relaxed text-[#181700]">{selected.patientNote}</p>
              </div>
            ) : null}

            <label className="block">
              <span className="text-xs font-semibold text-[#181700]">Catatan untuk pasien (opsional)</span>
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={3}
                placeholder="Contoh: jadwal disetujui, mohon datang 10 menit lebih awal."
                className="mt-1.5 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-[#181700] outline-none transition-colors focus:border-[var(--hafta-ylw-300)] focus:ring-2 focus:ring-[var(--hafta-ylw-100)]/60"
              />
            </label>
          </div>
        ) : null}
      </GlobalSlideOver>
    </section>
  );
}
