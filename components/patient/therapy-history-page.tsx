'use client';

import { useMemo, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  FilePenLine,
  Filter,
  LayoutList,
  Loader2,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { FilterPendingBar, SmartFilterMenu } from '@/components/ui/smart-filter-menu';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { MedicalRecordPrintDialog } from '@/components/pdf/medical-record-print-dialog';
import { cn } from '@/lib/utils';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';

const METRICS = [
  { key: 'pain', label: 'Nyeri', field: 'painScore' as const },
  { key: 'rom', label: 'ROM', field: 'rangeOfMotionScore' as const },
  { key: 'strength', label: 'Kekuatan', field: 'strengthScore' as const },
  { key: 'function', label: 'Fungsi', field: 'functionScore' as const },
] as const;

function metricColor(key: string, value: number) {
  const v = Math.max(0, Math.min(10, Number(value)));
  if (key === 'pain') {
    if (v <= 3) return 'bg-[var(--hafta-grn-500)]';
    if (v <= 6) return 'bg-[var(--hafta-org-400)]';
    return 'bg-[var(--hafta-red-500)]';
  }
  if (v >= 8) return 'bg-[var(--hafta-grn-500)]';
  if (v >= 6) return 'bg-[var(--hafta-org-400)]';
  if (v >= 3) return 'bg-[var(--hafta-org-400)]';
  return 'bg-[var(--hafta-red-500)]';
}

function metricBg(key: string, value: number) {
  const v = Math.max(0, Math.min(10, Number(value)));
  if (key === 'pain') {
    if (v <= 3) return 'bg-[var(--hafta-grn-50)]';
    if (v <= 6) return 'bg-[var(--hafta-org-50)]';
    return 'bg-[var(--hafta-red-50)]';
  }
  if (v >= 8) return 'bg-[var(--hafta-grn-50)]';
  if (v >= 6) return 'bg-[var(--hafta-org-50)]';
  if (v >= 3) return 'bg-[var(--hafta-org-50)]';
  return 'bg-[var(--hafta-red-50)]';
}

function metricText(key: string, value: number) {
  const v = Math.max(0, Math.min(10, Number(value)));
  if (key === 'pain') {
    if (v <= 3) return 'text-[var(--hafta-grn-700)]';
    if (v <= 6) return 'text-[var(--hafta-org-700)]';
    return 'text-[var(--hafta-red-700)]';
  }
  if (v >= 8) return 'text-[var(--hafta-grn-700)]';
  if (v >= 6) return 'text-[var(--hafta-org-700)]';
  if (v >= 3) return 'text-[var(--hafta-org-700)]';
  return 'text-[var(--hafta-red-700)]';
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TherapyHistoryPage({
  initialRecords,
  initialSearch = '',
}: {
  initialRecords: TherapyProgressView[];
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FINALIZED' | 'DRAFT'>('ALL');
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const historyTimerRef = useRef<number | null>(null);

  const allRecords = initialRecords;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allRecords.filter((rec) => {
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (!term) return true;
      return (
        rec.diagnosis?.toLowerCase().includes(term) ||
        rec.treatment?.toLowerCase().includes(term) ||
        rec.therapistName?.toLowerCase().includes(term) ||
        rec.summary?.toLowerCase().includes(term)
      );
    });
  }, [allRecords, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilterCount = statusFilter !== 'ALL' ? 1 : 0;
  const hasQuery = search.trim().length > 0;

  const [detailRecord, setDetailRecord] = useState<TherapyProgressView | null>(null);
  const [printRecord, setPrintRecord] = useState<TherapyProgressView | null>(null);

  const visitNumberById = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...allRecords].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    const visitNumberByDate = new Map<string, number>();
    for (const record of sorted) {
      const date = new Date(record.recordedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!visitNumberByDate.has(key)) visitNumberByDate.set(key, visitNumberByDate.size + 1);
      map.set(record.id, visitNumberByDate.get(key) ?? 1);
    }
    return map;
  }, [allRecords]);

  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      <DashboardPageHeader
        title="Riwayat Rekam Medis"
        description="Riwayat pemeriksaan dan evaluasi terapi Anda."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Riwayat' }]}
        icon={<Activity className="h-6 w-6 text-[var(--hafta-org-100)]" />}
      />

      {/* Search + Filter */}
      <div className="flex w-full items-center gap-2">
        <FilterPendingBar active={isPending} />
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              setPage(1);
              if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
              if (value.trim().length >= 2) {
                historyTimerRef.current = window.setTimeout(() => null, 800);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setPage(1);
            }}
            placeholder="Cari riwayat rekam medis..."
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-10 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--hafta-950)] focus:ring-4 focus:ring-[var(--hafta-org-200)]/35 sm:text-[13px]"
          />
          {search ? (
            <button
              type="button"
              aria-label="Bersihkan kata kunci"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--hafta-50)] hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <SmartFilterMenu count={activeFilterCount} pending={isPending}>
          {(close) => (
            <>
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Status Rekam
              </p>
              {(
                [
                  { value: 'ALL' as const, label: 'Semua' },
                  { value: 'FINALIZED' as const, label: 'Final' },
                  { value: 'DRAFT' as const, label: 'Amandemen' },
                ] as const
              ).map((option) => {
                const selected = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                      setPage(1);
                      close();
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors',
                      selected
                        ? 'bg-[var(--hafta-50)] font-bold text-foreground'
                        : 'font-medium text-muted-foreground hover:bg-[var(--hafta-50)] hover:text-foreground',
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {selected ? <X className="h-3.5 w-3.5" /> : null}
                  </button>
                );
              })}
            </>
          )}
        </SmartFilterMenu>
      </div>

      {/* Results count */}
      {visibleRecords.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span> rekam medis ditemukan
        </p>
      )}

      {/* Cards */}
      {visibleRecords.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-3.5 text-center sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-foreground">
            <Search className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-foreground">
            {hasQuery || activeFilterCount > 0
              ? 'Tidak ditemukan rekam medis untuk filter tersebut'
              : 'Belum ada riwayat rekam medis'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {hasQuery || activeFilterCount > 0
              ? 'Periksa kembali kata kunci atau filter status, lalu coba lagi.'
              : 'Riwayat rekam medis akan tampil di sini setelah fisioterapis menambahkan evaluasi.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {visibleRecords.map((record) => {
            const isFinal = record.status === 'FINALIZED';
            const isAmendment = Boolean(record.amendedFromId);
            const visitNum = visitNumberById.get(record.id) ?? 1;
            const date = new Date(record.recordedAt);

            return (
              <article
                key={record.id}
                className="rounded-3xl border border-stone-200 bg-white p-4 transition-all sm:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--hafta-org-50)] text-[#181700]">
                    <span className="text-lg font-extrabold leading-none">{date.getDate()}</span>
                    <span className="text-[9px] font-bold uppercase">
                      {date.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#181700]">
                        Evaluasi Sesi {visitNum}
                      </h3>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                          isFinal
                            ? 'border-[var(--hafta-grn-200)] bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)]'
                            : 'border-stone-200 bg-white text-stone-600',
                        )}
                      >
                        {isFinal ? 'Final' : 'Draft'}
                      </span>
                      {isAmendment ? (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Amandemen
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                      <CalendarDays className="h-3 w-3" />
                      {formatShortDate(date)}
                      {record.therapistName ? ` · ${record.therapistName}` : ''}
                    </p>

                    {/* Clinical indicators */}
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {METRICS.map(({ key, label, field }) => {
                        const value = Number(record[field] ?? 0);
                        return (
                          <div
                            key={key}
                            className={cn(
                              'rounded-2xl bg-[var(--hafta-50)] p-2.5 text-center sm:p-3',
                            )}
                          >
                            <span className="block text-[10px] font-medium text-muted-foreground">
                              {label}
                            </span>
                            <span className="block text-lg font-bold tabular-nums text-[#181700]">
                              {value}/10
                            </span>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200">
                              <div
                                className={cn('h-full rounded-full transition-all', metricColor(key, value))}
                                style={{ width: `${value * 10}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Diagnosis & Treatment */}
                    {(record.diagnosis || record.treatment) && (
                      <div className="mt-3 space-y-1">
                        {record.diagnosis && (
                          <p className="truncate text-xs text-stone-500">
                            <span className="font-semibold text-stone-700">Diagnosis:</span>{' '}
                            {record.diagnosis}
                          </p>
                        )}
                        {record.treatment && (
                          <p className="truncate text-xs text-stone-500">
                            <span className="font-semibold text-stone-700">Tindakan:</span>{' '}
                            {record.treatment}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailRecord(record)}
                        className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-[var(--hafta-50)]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Lihat Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintRecord(record)}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh PDF
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          <PaginationBar
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Detail Drawer */}
      <GlobalSlideOver
        isOpen={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        size="md"
        icon={<Activity className="h-4 w-4" />}
        title={detailRecord ? `Evaluasi Sesi ${visitNumberById.get(detailRecord.id) ?? 1}` : 'Evaluasi'}
        subtitle={detailRecord ? formatShortDate(new Date(detailRecord.recordedAt)) : undefined}
        footer={
          detailRecord ? (
            <Button
              variant="default"
              size="default"
              className="w-full"
              onClick={() => {
                setPrintRecord(detailRecord);
              }}
            >
              <Printer className="h-4 w-4" />
              Cetak / Unduh PDF
            </Button>
          ) : null
        }
      >
        {detailRecord ? (
          <div className="space-y-4">
            {METRICS.map(({ key, label, field }) => {
              const value = Number(detailRecord[field] ?? 0);
              return (
                <div key={key} className={cn('rounded-2xl p-3', metricBg(key, value))}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className={cn('text-lg font-bold', metricText(key, value))}>{value}/10</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/50">
                    <div
                      className={cn('h-full rounded-full', metricColor(key, value))}
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {detailRecord.diagnosis && (
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Diagnosis</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{detailRecord.diagnosis}</p>
              </div>
            )}

            {detailRecord.treatment && (
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tindakan</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{detailRecord.treatment}</p>
              </div>
            )}

            {detailRecord.evaluation && (
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evaluasi</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{detailRecord.evaluation}</p>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Terapis</p>
              <p className="mt-1 text-sm font-medium text-foreground">{detailRecord.therapistName || 'Fisioterapis Hafta'}</p>
            </div>
          </div>
        ) : null}
      </GlobalSlideOver>

      {/* PDF Print Dialog */}
      <MedicalRecordPrintDialog
        record={printRecord as any}
        open={Boolean(printRecord)}
        onOpenChange={(open) => {
          if (!open) setPrintRecord(null);
        }}
      />
    </div>
  );
}
