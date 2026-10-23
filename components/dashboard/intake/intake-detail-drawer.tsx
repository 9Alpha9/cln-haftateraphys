'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { fetchIntakeDetailAction } from '@/server/actions/intake-details';
import { reviewPatientIntake } from '@/server/actions/intake-review';
import { cn } from '@/lib/utils';

interface IntakeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | null;
  initialPatientName?: string;
  canReview?: boolean;
}

const statusBadgeMap: Record<
  string,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  SUBMITTED: {
    label: 'Terkirim',
    dot: 'bg-[var(--hafta-org-400)]',
    text: 'text-[var(--hafta-org-700)]',
    bg: 'bg-[var(--hafta-org-50)]',
    border: 'border-[var(--hafta-org-200)]',
  },
  UNDER_REVIEW: {
    label: 'Sedang Ditinjau',
    dot: 'bg-[var(--hafta-ylw-400)]',
    text: 'text-[var(--hafta-ylw-950)]',
    bg: 'bg-[var(--hafta-ylw-50)]',
    border: 'border-[var(--hafta-ylw-200)]',
  },
  ACCEPTED: {
    label: 'Diterima',
    dot: 'bg-[var(--hafta-grn-500)]',
    text: 'text-[var(--hafta-grn-700)]',
    bg: 'bg-[var(--hafta-grn-50)]',
    border: 'border-[var(--hafta-grn-200)]',
  },
  NEEDS_REVISION: {
    label: 'Perlu Revisi',
    dot: 'bg-[var(--hafta-red-500)]',
    text: 'text-[var(--hafta-red-700)]',
    bg: 'bg-[var(--hafta-red-50)]',
    border: 'border-[var(--hafta-red-200)]',
  },
  ARCHIVED: {
    label: 'Diarsipkan',
    dot: 'bg-stone-400',
    text: 'text-stone-600',
    bg: 'bg-stone-100',
    border: 'border-stone-200',
  },
  DRAFT: {
    label: 'Draf',
    dot: 'bg-stone-400',
    text: 'text-stone-600',
    bg: 'bg-stone-100',
    border: 'border-stone-200',
  },
};

export function IntakeDetailDrawer({
  isOpen,
  onClose,
  patientId,
  initialPatientName,
  canReview = true,
}: IntakeDetailDrawerProps) {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, startFetchTransition] = useTransition();

  // Review Actions state
  const [isActionPending, startTransition] = useTransition();
  const [reviewMessage, setReviewMessage] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    let isMounted = true;
    startFetchTransition(async () => {
      setShowRevisionInput(false);
      setReviewMessage('');
      const res = await fetchIntakeDetailAction(patientId);
      if (!isMounted) return;
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setData(null);
        setError(res.error || 'Gagal memuat rincian form awal.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, patientId]);

  function handleAction(action: 'start-review' | 'request-revision' | 'accept') {
    if (!patientId) return;
    setError(null);

    startTransition(async () => {
      try {
        await reviewPatientIntake({ patientId, action, reviewMessage });
        // Refresh local view
        const refreshed = await fetchIntakeDetailAction(patientId);
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
          setShowRevisionInput(false);
          router.refresh();
        }
      } catch (err: any) {
        setError(err?.message || 'Aksi peninjauan tidak dapat dilakukan.');
      }
    });
  }

  const currentStatus = data?.status || 'SUBMITTED';
  const badgeConfig = statusBadgeMap[currentStatus] ?? statusBadgeMap.SUBMITTED;

  // Key-value pairs for compact clinical layout
  const clinicalSections = [
    {
      group: 'Keluhan & Riwayat Awal',
      rows: [
        { label: 'Keluhan Utama', value: data?.chiefComplaint },
        { label: 'Area Tubuh Terdampak', value: data?.affectedArea },
        { label: 'Awal Mula Keluhan', value: data?.onsetDescription },
        { label: 'Pemicu Keluhan', value: data?.triggeringEvent },
      ],
    },
    {
      group: 'Faktor & Batasan Gerak',
      rows: [
        { label: 'Faktor Memperberat', value: data?.aggravatingFactors },
        { label: 'Faktor Meredakan', value: data?.relievingFactors },
        { label: 'Batasan Aktivitas Sehari-hari', value: data?.dailyLimitations },
        { label: 'Target / Harapan Pasien', value: data?.patientGoal },
      ],
    },
    {
      group: 'Riwayat Medis & Pengobatan',
      rows: [
        { label: 'Riwayat Cedera Sebelumnya', value: data?.previousInjuryHistory },
        { label: 'Riwayat Tindakan Operasi', value: data?.surgeryHistory },
        { label: 'Riwayat Penyakit Relevan', value: data?.relevantMedicalHistory },
        { label: 'Konsumsi Obat Saat Ini', value: data?.currentMedication },
        { label: 'Alergi Pasien', value: data?.allergies },
      ],
    },
  ];

  return (
    <GlobalSlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={data?.patientName || initialPatientName || 'Detail Form Awal'}
      subtitle={patientId ? `ID Pasien: ${patientId.slice(0, 8)}` : undefined}
      badge={
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold',
            badgeConfig.bg,
            badgeConfig.text,
            badgeConfig.border
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', badgeConfig.dot)} />
          {badgeConfig.label}
        </span>
      }
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {patientId && (
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#181700] hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <span>Lihat Profil Pasien</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-500 hover:text-[#181700] transition-colors"
            >
              Tutup
            </button>
          </div>

          {/* Action buttons based on status */}
          {canReview && data && (
            <div className="flex items-center gap-2">
              {currentStatus === 'SUBMITTED' && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleAction('start-review')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--hafta-ylw-100)] px-4 py-2 text-xs font-bold text-[#181700] shadow-2xs hover:bg-[var(--hafta-ylw-200)] transition-all cursor-pointer disabled:opacity-60"
                >
                  {isActionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Mulai Tinjau Form</span>
                </button>
              )}

              {currentStatus === 'UNDER_REVIEW' && (
                <>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => setShowRevisionInput((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>Minta Perbaikan</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => handleAction('accept')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isActionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Terima / ACC Form</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      }
    >
      {/* ── BODY KONTEN DRAWER ── */}
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#181700]" />
          <p className="mt-3 text-xs font-semibold text-stone-600">Memuat rincian form awal...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-red-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Gagal Menampilkan Data</p>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : data ? (
        <div>
          {!canReview ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold">Mode baca saja</p>
                <p className="leading-relaxed text-amber-900">
                  Peran Anda dapat melihat Form Awal, tetapi peninjauan klinis hanya dapat dilakukan oleh Admin atau
                  Fisioterapis yang berwenang.
                </p>
              </div>
            </div>
          ) : currentStatus === 'ACCEPTED' || currentStatus === 'ARCHIVED' ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed">
                Form Awal ini sudah final. Pasien dapat memulai episode baru dari portal pasien bila diperlukan.
              </p>
            </div>
          ) : null}

          {/* Header Info Banner: Standalone Full-bleed Edge-to-Edge (Tanpa padding top/left/right container) */}
          <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-5 border-b border-stone-200/80 bg-[#FEFEF6] px-5 py-4 sm:px-6 sm:py-4.5 text-xs text-stone-600">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
              <span className="font-bold text-[#181700]">Ringkasan Pengiriman</span>
              <span className="flex items-center gap-1.5 font-medium text-stone-500">
                <Clock className="h-3.5 w-3.5" />
                {data.submittedAt
                  ? `Dikirim pada ${new Date(data.submittedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Belum dikirim final'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              Form ini memuat data anamnesis mandiri pasien yang diisi melalui Patient Portal sebelum evaluasi fisik
              langsung di klinik.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {/* Form Permintaan Revisi (Muncul saat tombol Minta Perbaikan ditekan) */}
            {showRevisionInput && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3 animate-in fade-in-50 duration-150">
                <label htmlFor="revision-note" className="block text-xs font-bold text-amber-950">
                  Catatan Perbaikan untuk Pasien:
                </label>
                <textarea
                  id="revision-note"
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  placeholder="Tuliskan bagian mana yang perlu dilengkapi atau diperjelas oleh pasien..."
                  rows={3}
                  className="w-full rounded-xl border border-amber-300 bg-white p-3 text-xs text-[#181700] outline-none focus:ring-2 focus:ring-[var(--hafta-ylw-400)]/40 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionInput(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending || !reviewMessage.trim()}
                    onClick={() => handleAction('request-revision')}
                    className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                  >
                    Kirim Permintaan Revisi
                  </button>
                </div>
              </div>
            )}

            {/* Catatan Peninjauan Jika Ada */}
            {data.reviewMessage && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
                <span className="font-bold text-[#181700]">Pesan Tindak Lanjut Pasien:</span>
                <p className="mt-1 text-stone-700 italic">&ldquo;{data.reviewMessage}&rdquo;</p>
              </div>
            )}

            {/* ── COMPACT CLINICAL DATA GROUPS (TABLE / KEY-VALUE GRID) ── */}
            <div className="space-y-5">
              {clinicalSections.map((sec) => (
                <div
                  key={sec.group}
                  className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs"
                >
                  <div className="bg-stone-50/90 px-4 py-2.5 border-b border-stone-200/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#181700]">
                      {sec.group}
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {sec.rows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-1 gap-1 px-4 py-2.5 text-xs sm:grid-cols-12 sm:gap-4 sm:py-3"
                      >
                        <span className="font-semibold text-stone-500 sm:col-span-4">
                          {row.label}
                        </span>
                        <span className="text-stone-900 sm:col-span-8 font-medium whitespace-pre-wrap leading-relaxed">
                          {row.value || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </GlobalSlideOver>
  );
}
