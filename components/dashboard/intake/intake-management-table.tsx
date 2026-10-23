'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Eye,
  Archive,
  Calendar,
  ClipboardList,
  User,
  Clock,
  Sparkles,
  Activity,
} from 'lucide-react';
import { NotchedCard } from '@/components/ui/notched-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archivePatientIntake } from '@/server/actions/intake-review';
import { IntakeDetailDrawer } from '@/components/dashboard/intake/intake-detail-drawer';
import { cn } from '@/lib/utils';

export type IntakeRowItem = {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  affectedArea: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
};

interface IntakeManagementTableProps {
  initialItems: IntakeRowItem[];
  canArchive: boolean;
  canReview: boolean;
}

const statusBadgeStyles: Record<
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

export function IntakeManagementTable({
  initialItems,
  canArchive,
  canReview,
}: IntakeManagementTableProps) {
  const router = useRouter();
  const items = initialItems;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REVISION'>('ALL');

  // Slide-over drawer state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Archive modal state
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [isArchivePending, setIsArchivePending] = useState(false);

  const handleOpenDetail = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setIsDrawerOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTargetId) return;
    setIsArchivePending(true);
    try {
      await archivePatientIntake(archiveTargetId);
      setArchiveTargetId(null);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsArchivePending(false);
    }
  };

  // Real-time filtering
  const filteredItems = items.filter((row) => {
    if (statusFilter === 'PENDING') {
      if (row.status !== 'SUBMITTED' && row.status !== 'UNDER_REVIEW') return false;
    } else if (statusFilter === 'ACCEPTED') {
      if (row.status !== 'ACCEPTED') return false;
    } else if (statusFilter === 'REVISION') {
      if (row.status !== 'NEEDS_REVISION') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = row.patientName.toLowerCase().includes(q);
      const matchArea = row.affectedArea ? row.affectedArea.toLowerCase().includes(q) : false;
      if (!matchName && !matchArea) return false;
    }

    return true;
  });

  const countPending = items.filter((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW').length;
  const countAccepted = items.filter((i) => i.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6">
      {/* ── 1. CONTROL BAR (STATUS FILTER TABS + REAL-TIME SEARCH) ── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              statusFilter === 'ALL'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              statusFilter === 'PENDING'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Perlu Ditinjau ({countPending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACCEPTED')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              statusFilter === 'ACCEPTED'
                ? 'bg-[#181700] text-white shadow-2xs'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            Diterima ({countAccepted})
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasien atau keluhan..."
            className="h-10 w-full rounded-xl border border-stone-200/90 bg-white pl-9 pr-3 text-xs text-[#181700] placeholder:text-stone-400 outline-none transition-all focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30 shadow-2xs"
          />
        </div>
      </div>

      {/* ── 2. INTERACTIVE CLINICAL INTAKE CARDS (GLOBAL INVERTED OUTLINE NOTCHEDCARD) ── */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="mt-3 text-sm font-bold text-[#181700]">Tidak ada data intake yang cocok</h3>
          <p className="mt-1 text-xs text-stone-500">Silakan ubah filter status atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const initial = item.patientName ? item.patientName.slice(0, 1).toUpperCase() : 'P';
            const status = statusBadgeStyles[item.status] ?? statusBadgeStyles.SUBMITTED;
            const isNewIntake = item.status === 'SUBMITTED';
            const isUnderReview = item.status === 'UNDER_REVIEW';
            const dateStr = new Date(item.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            // Card background: kuning (#f7f000) HANYA jika intake baru masuk (SUBMITTED). Jika sudah diproses/diterima -> putih.
            const cardVariant = isNewIntake ? 'accent' : 'white';

            return (
              <NotchedCard
                key={item.id}
                variant={cardVariant}
                icon={
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#181700] font-bold text-xs text-[var(--hafta-ylw-100)] shadow-2xs">
                    {initial}
                  </span>
                }
                badge={
                  <div className="flex items-center gap-1.5">
                    {/* Tulisan BARU tetap muncul selama intake berstatus SUBMITTED (belum diproses/ACC) */}
                    {isNewIntake && (
                      <span className="rounded-full bg-[#181700] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[var(--hafta-ylw-100)] shadow-2xs animate-pulse">
                        BARU
                      </span>
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold',
                        status.bg,
                        status.text,
                        status.border
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </div>
                }
                title={item.patientName}
                description={
                  <span className={cn('font-mono text-[11px]', isNewIntake ? 'text-[#181700]/70' : 'text-stone-400')}>
                    ID Pasien: {item.patientId.slice(0, 8)}
                  </span>
                }
                buttonText="Buka Detail"
                onClick={() => handleOpenDetail(item.patientId, item.patientName)}
                className="h-full min-h-[290px]"
              >
                {/* ── CARD BODY DETAIL SECTION ── */}
                <div className="mt-4 space-y-2.5 pt-3 border-t border-current/10 text-xs">
                  {/* Area Keluhan */}
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', isNewIntake ? 'text-[#181700]/80' : 'text-stone-500')}>
                      Area Keluhan:
                    </span>
                    <span className="inline-flex rounded-lg bg-stone-100/90 px-2.5 py-0.5 text-xs font-bold capitalize text-[#181700]">
                      {item.affectedArea || 'Keluhan Umum'}
                    </span>
                  </div>

                  {/* Tanggal Diperbarui */}
                  <div className={cn('flex items-center justify-between', isNewIntake ? 'text-[#181700]/80' : 'text-stone-500')}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Diperbarui:
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#181700]">{dateStr}</span>
                  </div>

                  {/* Status Asesmen / Catatan Singkat */}
                  <div className="pt-2">
                    <p className={cn('line-clamp-2 text-[11px] leading-relaxed italic', isNewIntake ? 'text-[#181700]/90 font-medium' : 'text-stone-600')}>
                      {isNewIntake
                        ? 'Form baru masuk! Menunggu verifikasi dan peninjauan awal oleh fisioterapis.'
                        : isUnderReview
                          ? 'Sedang dalam proses peninjauan oleh tim fisioterapi.'
                          : 'Form intake telah disetujui untuk sesi terapi lanjutan.'}
                    </p>
                  </div>
                </div>
              </NotchedCard>
            );
          })}
        </div>
      )}

      {/* ── 3. REUSABLE INTAKE DETAIL DRAWER (GLOBAL SLIDE-OVER) ── */}
      <IntakeDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        patientId={selectedPatientId}
        initialPatientName={selectedPatientName}
        canReview={canReview}
      />

      {/* ── 4. CONFIRM ARCHIVE MODAL ── */}
      <ConfirmDialog
        isOpen={Boolean(archiveTargetId)}
        title="Arsipkan Form Awal?"
        description="Form intake ini akan dipindahkan ke arsip tanpa dihapus secara permanen."
        confirmLabel="Ya, Arsipkan"
        pending={isArchivePending}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTargetId(null)}
      />
    </div>
  );
}
