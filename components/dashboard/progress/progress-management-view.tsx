'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  FilePenLine,
  Filter,
  History,
  LayoutList,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Stethoscope,
  MoreVertical,
  Printer,
  FileDown,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { SmartFilterMenu } from '@/components/ui/smart-filter-menu';
import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';
import { MedicalRecordActions, useMedicalRecordPdf } from '@/components/dashboard/medical-record-actions';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';
import { ProgressAmendmentDialog } from '@/components/dashboard/progress/progress-amendment-dialog';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import { cn } from '@/lib/utils';

interface ProgressManagementViewProps {
  initialRecords: TherapyProgressView[];
  canEdit: boolean;
  patientOptions: { id: string; label: string }[];
  initialSearch?: string;
}

function getScoreColor(type: 'pain' | 'rom' | 'strength' | 'function', value: number) {
  if (type === 'pain') {
    // Skor nyeri: 0-3 hijau, 4-6 kuning/oranye, 7-10 merah
    if (value <= 3) return 'bg-emerald-500 text-emerald-700';
    if (value <= 6) return 'bg-amber-500 text-amber-700';
    return 'bg-red-500 text-red-700';
  }
  // Skor ROM, kekuatan, fungsional: makin tinggi makin hijau
  if (value >= 7) return 'bg-emerald-500 text-emerald-700';
  if (value >= 4) return 'bg-[var(--hafta-org-400)] text-[var(--hafta-org-800)]';
  return 'bg-amber-500 text-amber-700';
}

interface MedicalRecordCardProps {
  record: TherapyProgressView;
  canEdit: boolean;
  onSelect: (record: TherapyProgressView) => void;
  onEdit: (record: TherapyProgressView) => void;
  onAmend: (record: TherapyProgressView) => void;
}

function MedicalRecordCard({
  record,
  canEdit,
  onSelect,
  onEdit,
  onAmend,
}: MedicalRecordCardProps) {
  const { openPrintPage, downloadPdf } = useMedicalRecordPdf(record);
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const isFinal = record.status === 'FINALIZED';
  const isAmendment = Boolean(record.amendedFromId);
  const revision = record.revisionNumber ?? 1;
  const dateStr = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const initials = record.patientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article
      key={record.id}
      onClick={() => onSelect(record)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(24,23,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(24,23,0,0.09)] sm:p-5"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {record.patientAvatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.patientAvatarKey}
                alt={record.patientName}
                className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-stone-200"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-xs font-bold text-[#181700]">
                {initials || 'RM'}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-[#181700] group-hover:text-[var(--hafta-org-950)] sm:text-base">
                {record.patientName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    isFinal
                      ? 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                      : 'border-[var(--hafta-org-200)] bg-[var(--hafta-org-50)] text-[var(--hafta-org-700)]',
                  )}
                >
                  {isFinal ? (
                    <Lock className="h-2.5 w-2.5" />
                  ) : (
                    <FilePenLine className="h-2.5 w-2.5" />
                  )}
                  {isFinal
                    ? `Final Terkunci${revision > 1 ? ` · R${revision}` : ''}`
                    : isAmendment
                      ? `Draft Amandemen · R${revision}`
                      : 'Draft'}
                </span>
                {revision > 1 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Amandemen R{revision}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="relative shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Menu opsi rekam medis"
              onClick={() => setShowRecordMenu((prev) => !prev)}
              className="inline-flex h-9 w-9 aspect-square shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white text-[#181700] transition-colors hover:bg-stone-100"
            >
              <MoreVertical className="h-4 w-4 shrink-0" />
            </button>

            {showRecordMenu && (
              <>
                <button
                  type="button"
                  aria-label="Tutup menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowRecordMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_12px_32px_rgba(24,23,0,0.14)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordMenu(false);
                      void openPrintPage();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 sm:text-sm"
                  >
                    <Printer className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                    <span className="text-xs font-medium">Print Rekam Medis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordMenu(false);
                      void downloadPdf();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 sm:text-sm"
                  >
                    <FileDown className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                    <span className="text-xs font-medium">Unduh PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2.5 rounded-2xl bg-[#FBFBFA] p-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
              No. RM {record.medicalRecordNumber ?? '-'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              {dateStr}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <span className="truncate">{record.therapistName || 'Terapis'}</span>
            </span>
            {record.visitNumber ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                Kunjungan {record.visitNumber}
              </span>
            ) : null}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                record.patientVisible ? 'bg-white text-stone-600' : 'bg-amber-50 text-amber-800',
              )}
              title={
                record.patientVisible
                  ? 'Dapat dilihat oleh pasien di portal'
                  : 'Akses internal terapis'
              }
            >
              {record.patientVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>{record.patientVisible ? 'Terlihat pasien' : 'Internal'}</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Nyeri', key: 'pain' as const, value: record.painScore },
              { label: 'ROM', key: 'rom' as const, value: record.rangeOfMotionScore },
              { label: 'Kekuatan', key: 'strength' as const, value: record.strengthScore },
              { label: 'Fungsi', key: 'function' as const, value: record.functionScore },
            ].map((metric) => (
              <div key={metric.key} className="rounded-xl bg-white/70 px-2 py-2 text-center">
                <span className="block text-[10px] text-stone-500">{metric.label}</span>
                <span className="text-xs font-bold text-[#181700]">{metric.value}</span>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-200/70">
                  <div
                    className={cn('h-full', getScoreColor(metric.key, metric.value).split(' ')[0])}
                    style={{ width: `${Math.min(100, metric.value * 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {(record.diagnosis || record.treatment) && (
            <div className="space-y-1 pt-0.5">
              <div className="line-clamp-1 font-medium text-[#181700]">
                Diagnosis: {record.diagnosis || '-'}
              </div>
              <div className="line-clamp-1 text-stone-600">
                Tindakan: {record.treatment || '-'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="mt-3 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelect(record)}
          className="inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-org-200)]"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          Lihat Detail SOAP
        </button>

        {canEdit ? (
          <button
            type="button"
            onClick={() => (isFinal ? onAmend(record) : onEdit(record))}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-stone-200/90 bg-white px-3.5 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100"
          >
            {isFinal ? <FilePenLine className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            <span>{isFinal ? 'Amandemen' : 'Edit'}</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ProgressManagementView({
  initialRecords,
  canEdit,
  patientOptions,
  initialSearch = '',
}: ProgressManagementViewProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [selectedRecord, setSelectedRecord] = useState<TherapyProgressView | null>(null);
  const [editingRecord, setEditingRecord] = useState<TherapyProgressView | null>(null);
  const [amendmentRecord, setAmendmentRecord] = useState<TherapyProgressView | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FINALIZED' | 'DRAFT'>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'VISIBLE' | 'INTERNAL'>('ALL');
  const [activeTab, setActiveTab] = useState<'soap' | 'metrics'>('soap');
  const [recordPage, setRecordPage] = useState(1);
  const [recordPageSize, setRecordPageSize] = useState(4);
  const [history, setHistory] = useState<string[]>([]);
  const historyTimerRef = useRef<number | null>(null);
  const SEARCH_HISTORY_KEY = 'hafta:progress-search-history';

  const hasQuery = search.trim().length > 0;

  useEffect(() => {
    let stored: string[] = [];
    try {
      const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) stored = parsed.filter((item): item is string => typeof item === 'string');
    } catch {
      stored = [];
    }
    const initial = initialSearch.trim();
    if (initial) {
      stored = [initial, ...stored.filter((item) => item.toLowerCase() !== initial.toLowerCase())].slice(0, 6);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(stored);
  }, [SEARCH_HISTORY_KEY, initialSearch]);

  useEffect(() => {
    return () => {
      if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    };
  }, []);

  function storeHistory(next: string[]) {
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }

  function pushHistory(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      storeHistory(next);
      return next;
    });
  }

  function removeHistory(value: string) {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== value);
      storeHistory(next);
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // ignore storage failures
    }
  }

  function applySearch(value: string) {
    setSearch(value);
    setRecordPage(1);
    const trimmed = value.trim();
    pushHistory(trimmed);
    startNavigation(() => {
      router.push(trimmed ? `/dashboard/progress?q=${encodeURIComponent(trimmed)}` : '/dashboard/progress');
    });
  }

  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) + (visibilityFilter !== 'ALL' ? 1 : 0);

  // Real-time filtering
  const filtered = initialRecords.filter((rec) => {
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
    if (visibilityFilter === 'VISIBLE' && !rec.patientVisible) return false;
    if (visibilityFilter === 'INTERNAL' && rec.patientVisible) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = rec.patientName.toLowerCase().includes(q);
      const matchRm = (rec.medicalRecordNumber ?? '').toLowerCase().includes(q);
      const matchDiagnosis = rec.diagnosis?.toLowerCase().includes(q) ?? false;
      const matchAnamnesis = rec.anamnesis?.toLowerCase().includes(q) ?? false;
      const matchTreatment = rec.treatment?.toLowerCase().includes(q) ?? false;
      const matchTherapist = rec.therapistName?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchRm && !matchDiagnosis && !matchAnamnesis && !matchTreatment && !matchTherapist) {
        return false;
      }
    }

    return true;
  });

  const recordPageCount = Math.max(1, Math.ceil(filtered.length / recordPageSize));
  const safeRecordPage = Math.min(recordPage, recordPageCount);
  const visibleRecords = filtered.slice(
    (safeRecordPage - 1) * recordPageSize,
    safeRecordPage * recordPageSize,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
    <div className="space-y-3">
        {/* Baris 1: Search + Aksi Cari/Reset */}
        <div className="flex w-full items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                setRecordPage(1);
                if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
                if (value.trim().length >= 2) {
                  historyTimerRef.current = window.setTimeout(() => pushHistory(value), 800);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch(search);
              }}
              placeholder="Cari No. RM, nama pasien, atau diagnosis..."
              className="h-10 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-10 text-xs text-[#181700] outline-none transition-all placeholder:text-stone-400 focus:border-[#181700] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35 sm:text-[13px]"
            />
            {search ? (
              <button
                type="button"
                aria-label="Bersihkan kata kunci"
                onClick={() => applySearch('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#181700]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="relative ml-auto shrink-0">
            <SmartFilterMenu count={activeFilterCount} panelClassName="w-56">
              {(close) => (
                <>
                  <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                    Status
                  </p>
                  {([
                    { value: 'ALL' as const, label: 'Semua', icon: LayoutList },
                    { value: 'FINALIZED' as const, label: 'Final', icon: CheckCircle2 },
                    { value: 'DRAFT' as const, label: 'Draft', icon: FileText },
                  ]).map((option) => {
                    const selected = statusFilter === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(option.value);
                          setRecordPage(1);
                          close();
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors',
                          selected
                            ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
                            : 'border-transparent font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-[#181700]' : 'text-stone-400')} />
                        <span className="flex-1">{option.label}</span>
                        {selected ? <Check className="h-3.5 w-3.5 text-[#181700]" /> : null}
                      </button>
                    );
                  })}

                  <div className="my-1.5 h-px bg-stone-100" />
                  <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                    Visibilitas
                  </p>
                  {([
                    { value: 'ALL' as const, label: 'Semua akses', icon: Eye },
                    { value: 'VISIBLE' as const, label: 'Akses Pasien', icon: Eye },
                    { value: 'INTERNAL' as const, label: 'Internal Terapis', icon: EyeOff },
                  ]).map((option) => {
                    const selected = visibilityFilter === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setVisibilityFilter(option.value);
                          setRecordPage(1);
                          close();
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors',
                          selected
                            ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
                            : 'border-transparent font-medium text-stone-600 hover:bg-stone-100 hover:text-[#181700]',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-[#181700]' : 'text-stone-400')} />
                        <span className="flex-1">{option.label}</span>
                        {selected ? <Check className="h-3.5 w-3.5 text-[#181700]" /> : null}
                      </button>
                    );
                  })}
                </>
              )}
            </SmartFilterMenu>
          </div>
        </div>

      </div>

      {/* ── 2. COMPACT CLINICAL REKAM MEDIS CARDS GRID ── */}
      {isNavigating ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <SkeletonPanel key={item} className="h-56 rounded-3xl p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-36 bg-stone-200" />
                  <SkeletonLine className="w-24 bg-stone-100" />
                </div>
                <SkeletonBlock className="h-6 w-20 rounded-full bg-stone-100" />
              </div>
              <div className="mt-5 space-y-3">
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-4/5 bg-stone-100" />
                <SkeletonLine className="w-2/3 bg-stone-100" />
              </div>
            </SkeletonPanel>
          ))}
        </div>
      ) : !hasQuery ? (
        <div className="space-y-4 sm:space-y-6">
          {history.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                  <History className="h-3.5 w-3.5" />
                  Riwayat pencarian
                </p>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-stone-400 transition-colors hover:text-[var(--hafta-red-600)]"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus semua
                </button>
              </div>

              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-stone-200/70 bg-white p-2.5"
                  >
                    <History className="h-4 w-4 shrink-0 text-stone-400" />
                    <button
                      type="button"
                      onClick={() => applySearch(item)}
                      className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-[#181700] hover:underline"
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus riwayat ${item}`}
                      onClick={() => removeHistory(item)}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#181700]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
              <Search className="h-6 w-6" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-[#181700]">
              Cari Pasien untuk Menampilkan Rekam Medis
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              Masukkan Nomor Rekam Medis (No. RM), Nama Pasien, atau Diagnosis pada kolom pencarian di atas
              untuk membuka riwayat evaluasi SOAP tanpa menumpuk ratusan data.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <p className="text-xs text-stone-500">
            <span className="font-bold text-[#181700]">{filtered.length}</span> rekam medis ditemukan
          </p>

          {filtered.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-3.5 text-center sm:p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                <Search className="h-6 w-6" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-[#181700]">
                Tidak ditemukan rekam medis untuk kata kunci tersebut
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
                Periksa kembali No. RM, nama pasien, atau diagnosis yang Anda ketik.
              </p>
              <button
                type="button"
                onClick={() => applySearch('')}
                className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-stone-200/90 bg-white px-4 sm:px-5 text-xs font-semibold text-[#181700] transition-colors hover:bg-stone-100"
              >
                Bersihkan Pencarian
              </button>
            </div>
          ) : (
            <>
              <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleRecords.map((record) => (
                  <MedicalRecordCard
                    key={record.id}
                    record={record}
                    canEdit={canEdit}
                    onSelect={() => setSelectedRecord(record)}
                    onEdit={() => setEditingRecord(record)}
                    onAmend={() => setAmendmentRecord(record)}
                  />
                ))}
              </div>
              <PaginationBar
                page={safeRecordPage}
                pageCount={recordPageCount}
                pageSize={recordPageSize}
                pageSizeOptions={[4, 10, 25]}
                onPageChange={setRecordPage}
                onPageSizeChange={(size) => {
                  setRecordPageSize(size);
                  setRecordPage(1);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* ── 3. REUSABLE DETAIL DRAWER (GLOBAL SLIDE-OVER UNTUK REKAM MEDIS) ── */}
      <GlobalSlideOver
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        size="lg"
        icon={<Activity className="h-5 w-5" />}
        title={selectedRecord?.patientName || 'Evaluasi Rekam Medis'}
        subtitle={
          selectedRecord ? (
            <span>
              {new Date(selectedRecord.recordedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              • Fisioterapis: {selectedRecord.therapistName || '-'}
              {selectedRecord.amendmentReason ? (
                <span className="mt-1 block">
                  Amandemen: {selectedRecord.amendmentReason}
                </span>
              ) : null}
            </span>
          ) : undefined
        }
        badge={
          selectedRecord ? (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border',
                selectedRecord.status === 'FINALIZED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              )}
            >
              {selectedRecord.status === 'FINALIZED'
                ? `Final Terkunci${
                    (selectedRecord.revisionNumber ?? 1) > 1
                      ? ` · R${selectedRecord.revisionNumber}`
                      : ''
                  }`
                : selectedRecord.amendedFromId
                  ? `Draft Amandemen · R${selectedRecord.revisionNumber ?? 1}`
                  : 'Draft'}
            </span>
          ) : null
        }
        headerTabs={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('soap')}
              className={cn(
                'rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                activeTab === 'soap'
                  ? 'bg-[var(--hafta-org-100)] text-[#181700]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Catatan SOAP &amp; Terapi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={cn(
                'rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                activeTab === 'metrics'
                  ? 'bg-[var(--hafta-org-100)] text-[#181700]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              Indikator Fungsional
            </button>
          </div>
        }
        footer={
          selectedRecord ? (
            <div className="flex items-center justify-between gap-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const record = selectedRecord;
                    setSelectedRecord(null);
                    if (record.status === 'FINALIZED') {
                      setAmendmentRecord(record);
                    } else {
                      setEditingRecord(record);
                    }
                  }}
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-[var(--hafta-org-100)] hover:bg-[var(--hafta-org-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                >
                  {selectedRecord.status === 'FINALIZED' ? (
                    <FilePenLine className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                  <span>{selectedRecord.status === 'FINALIZED' ? 'Amandemen' : 'Edit'}</span>
                </button>
              )}
              <MedicalRecordActions record={selectedRecord} />
            </div>
          ) : null
        }
      >
        {selectedRecord && (
          <div>
            {/* Standalone Full-bleed Edge Banner */}
            <div className="-mx-3.5 -mt-3.5 sm:-mx-6 sm:-mt-4 border-b border-stone-200/80 bg-[#FEFEF6] px-3.5 py-3.5 sm:px-6 sm:py-4.5 text-xs text-stone-600">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                <span className="font-bold text-[#181700]">Diagnosis Klinis Fisioterapi</span>
                <span className="flex items-center gap-1 font-semibold text-stone-500">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {selectedRecord.diagnosis || 'Belum didiagnosis'}
                </span>
              </div>
              <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                Catatan rekam medis terstruktur mengacu pada standar International Classification of Functioning (ICF)
                dan praktik fisioterapi berbasis bukti ilmiah.
              </p>
            </div>

            <div className="mt-6 space-y-4 sm:space-y-5">
              {activeTab === 'soap' ? (
                <>
                  {/* Subjective (Anamnesis) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4 space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      S — Subjective (Anamnesis &amp; Keluhan Pasien)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.anamnesis || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Objective (Pemeriksaan Fisik) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4 space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      O — Objective (Pemeriksaan Fisik, Palpasi, &amp; Tes Spesifik)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.physicalExamination || (
                        <span className="text-stone-300 italic">Tidak ada catatan pemeriksaan fisik</span>
                      )}
                    </p>
                  </div>

                  {/* Assessment */}
                  <div className="rounded-2xl border border-[var(--hafta-org-200)]/80 bg-[var(--hafta-org-50)]/30 p-4.5 space-y-1.5">
                    <span className="font-bold text-xs text-[var(--hafta-org-950)] block">
                      A — Assessment &amp; Kesimpulan Klinis
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedRecord.diagnosis || <span className="text-stone-400 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Plan (Tindakan Terapi) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4 space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      P — Plan (Modalitas, Terapi Manual, &amp; Intervensi Latihan)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.treatment || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Home Exercise & Follow up */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-3 sm:p-4 space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      Rencana Tindak Lanjut &amp; Edukasi Mandiri (HEP)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.followUpPlan || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                    </p>
                  </div>
                </>
              ) : (
                /* Tab Metrik & Indikator Fungsional */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-5 space-y-4">
                    <h4 className="font-bold text-xs text-[#181700]">
                      Perkembangan Skor Fungsional Sesi Ini
                    </h4>

                    {/* Progress Bar VAS */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600">Visual Analogue Scale (Skor Nyeri)</span>
                        <span className="font-mono font-bold text-[#181700]">{selectedRecord.painScore} / 10</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={cn('h-full', getScoreColor('pain', selectedRecord.painScore).split(' ')[0])}
                          style={{ width: `${selectedRecord.painScore * 10}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Skor 0 (tanpa nyeri) hingga 10 (nyeri sangat hebat).
                      </p>
                    </div>

                    {/* ROM */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600">Range of Motion (Lingkup Gerak Sendi)</span>
                        <span className="font-mono font-bold text-[#181700]">
                          {selectedRecord.rangeOfMotionScore} / 10
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${selectedRecord.rangeOfMotionScore * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* MMT */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600">Manual Muscle Testing (Kekuatan Otot)</span>
                        <span className="font-mono font-bold text-[#181700]">
                          {selectedRecord.strengthScore} / 10
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${selectedRecord.strengthScore * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* ADL Function */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600">Aktivitas Fungsional Harian (ADL)</span>
                        <span className="font-mono font-bold text-[#181700]">
                          {selectedRecord.functionScore} / 10
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${selectedRecord.functionScore * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlobalSlideOver>

      {amendmentRecord ? (
        <ProgressAmendmentDialog
          record={amendmentRecord}
          onClose={() => setAmendmentRecord(null)}
        />
      ) : null}

      <MedicalRecordFormDrawer
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        patientOptions={patientOptions}
      />
    </div>
  );
}
