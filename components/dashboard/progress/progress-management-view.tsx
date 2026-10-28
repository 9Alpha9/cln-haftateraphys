'use client';

import React, { useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Pencil,
  FileText,
  Stethoscope,
  MoreVertical,
  Printer,
  FileDown,
} from 'lucide-react';
import { GlobalSlideOver } from '@/components/ui/global-slide-over';
import { MedicalRecordActions, useMedicalRecordPdf } from '@/components/dashboard/medical-record-actions';
import { MedicalRecordFormDrawer } from '@/components/dashboard/progress/medical-record-form-drawer';
import type { TherapyProgressView } from '@/server/queries/therapy-progress';
import { cn } from '@/lib/utils';

interface ProgressManagementViewProps {
  initialRecords: TherapyProgressView[];
  canEdit: boolean;
  patientOptions: { id: string; label: string }[];
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
  if (value >= 4) return 'bg-[var(--hafta-ylw-400)] text-[var(--hafta-ylw-800)]';
  return 'bg-amber-500 text-amber-700';
}

interface MedicalRecordCardProps {
  record: TherapyProgressView;
  canEdit: boolean;
  onSelect: (record: TherapyProgressView) => void;
  onEdit: (record: TherapyProgressView) => void;
}

function MedicalRecordCard({
  record,
  canEdit,
  onSelect,
  onEdit,
}: MedicalRecordCardProps) {
  const { openPrintPage, downloadPdf } = useMedicalRecordPdf(record);
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const isFinal = record.status === 'FINALIZED';
  const dateStr = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      key={record.id}
      onClick={() => onSelect(record)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-stone-300 cursor-pointer"
    >
      <div>
        {/* Baris Atas: Nama Pasien & Status Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[#181700] group-hover:text-[var(--hafta-ylw-950)]">
              {record.patientName}
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 font-medium">
              {dateStr} • Oleh: {record.therapistName || 'Terapis'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border',
                isFinal
                  ? 'bg-[var(--hafta-grn-50)] text-[var(--hafta-grn-700)] border-[var(--hafta-grn-200)]'
                  : 'bg-[var(--hafta-org-50)] text-[var(--hafta-org-700)] border-[var(--hafta-org-200)]'
              )}
            >
              {isFinal ? 'Final Terkunci' : 'Draft'}
            </span>

            {/* Visibility Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                record.patientVisible
                  ? 'bg-stone-50 text-stone-700 border-stone-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              )}
              title={record.patientVisible ? 'Dapat dilihat oleh pasien di portal' : 'Akses internal terapis'}
            >
              {record.patientVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>{record.patientVisible ? 'Pasien' : 'Internal'}</span>
            </span>
          </div>
        </div>

        {/* 4 Metrik Klinis Ringkas dengan Visual Bar */}
        <div className="py-2.5 my-2.5 border-y border-stone-100 grid grid-cols-4 gap-2">
          <div className="text-center">
            <span className="block text-[11px] text-stone-500">Nyeri</span>
            <span className="text-xs font-bold text-[#181700]">{record.painScore}</span>
            <div className="mt-1 h-1 w-full bg-stone-100 overflow-hidden">
              <div
                className={cn('h-full', getScoreColor('pain', record.painScore).split(' ')[0])}
                style={{ width: `${Math.min(100, record.painScore * 10)}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <span className="block text-[11px] text-stone-500">ROM</span>
            <span className="text-xs font-bold text-[#181700]">{record.rangeOfMotionScore}</span>
            <div className="mt-1 h-1 w-full bg-stone-100 overflow-hidden">
              <div
                className={cn('h-full', getScoreColor('rom', record.rangeOfMotionScore).split(' ')[0])}
                style={{ width: `${Math.min(100, record.rangeOfMotionScore * 10)}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <span className="block text-[11px] text-stone-500">Kekuatan</span>
            <span className="text-xs font-bold text-[#181700]">{record.strengthScore}</span>
            <div className="mt-1 h-1 w-full bg-stone-100 overflow-hidden">
              <div
                className={cn('h-full', getScoreColor('strength', record.strengthScore).split(' ')[0])}
                style={{ width: `${Math.min(100, record.strengthScore * 10)}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <span className="block text-[11px] text-stone-500">Fungsi</span>
            <span className="text-xs font-bold text-[#181700]">{record.functionScore}</span>
            <div className="mt-1 h-1 w-full bg-stone-100 overflow-hidden">
              <div
                className={cn('h-full', getScoreColor('function', record.functionScore).split(' ')[0])}
                style={{ width: `${Math.min(100, record.functionScore * 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ringkasan Diagnosis & Tindakan (1 blok kompak, lewat jika kosong) */}
        {(record.diagnosis || record.treatment) && (
          <div className="mt-3 rounded-xl bg-[#F8F8F5] px-3.5 py-2.5 text-xs space-y-1">
            <div className="line-clamp-1 font-medium text-[#181700]">
              Diagnosis: {record.diagnosis || '-'}
            </div>
            <div className="line-clamp-1 text-stone-600">
              Tindakan: {record.treatment || '-'}
            </div>
          </div>
        )}
      </div>

      {/* Footer Baris Aksi — 1 Baris Kompak di Semua Layar */}
      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onSelect(record)}
          className="h-9 px-4 rounded-full bg-[#181700] hover:bg-[var(--hafta-ylw-100)] text-white hover:text-[#181700] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
        >
          Lihat Detail SOAP
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="h-9 px-3.5 rounded-full bg-white hover:bg-stone-100 border border-stone-200/90 text-[#181700] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          )}
          <div className="relative inline-flex shrink-0">
            <button
              type="button"
              aria-label="Menu opsi rekam medis"
              onClick={() => setShowRecordMenu((prev) => !prev)}
              className="w-9 h-9 aspect-square rounded-full border border-stone-200/90 bg-white hover:bg-stone-100 flex items-center justify-center cursor-pointer shrink-0"
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
                <div className="absolute bottom-full right-0 z-20 mb-2 w-48 origin-bottom-right rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordMenu(false);
                      void openPrintPage();
                    }}
                    className="hover:bg-stone-50 cursor-pointer rounded-full font-medium flex items-center gap-2 w-full px-3 py-2 text-left text-xs sm:text-sm text-stone-700 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                    <span className="font-medium text-xs">Print Rekam Medis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordMenu(false);
                      void downloadPdf();
                    }}
                    className="hover:bg-stone-50 cursor-pointer rounded-full font-medium flex items-center gap-2 w-full px-3 py-2 text-left text-xs sm:text-sm text-stone-700 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                    <span className="font-medium text-xs">Unduh PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProgressManagementView({
  initialRecords,
  canEdit,
  patientOptions,
}: ProgressManagementViewProps) {
  const [selectedRecord, setSelectedRecord] = useState<TherapyProgressView | null>(null);
  const [editingRecord, setEditingRecord] = useState<TherapyProgressView | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FINALIZED' | 'DRAFT'>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'VISIBLE' | 'INTERNAL'>('ALL');
  const [activeTab, setActiveTab] = useState<'soap' | 'metrics'>('soap');

  // Real-time filtering
  const filtered = initialRecords.filter((rec) => {
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
    if (visibilityFilter === 'VISIBLE' && !rec.patientVisible) return false;
    if (visibilityFilter === 'INTERNAL' && rec.patientVisible) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = rec.patientName.toLowerCase().includes(q);
      const matchDiagnosis = rec.diagnosis?.toLowerCase().includes(q) ?? false;
      const matchTreatment = rec.treatment?.toLowerCase().includes(q) ?? false;
      const matchTherapist = rec.therapistName?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchDiagnosis && !matchTreatment && !matchTherapist) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
    <div className="space-y-3">
        {/* Baris 1: Search */}
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pasien, diagnosis, atau terapis..."
            className="h-11 w-full rounded-full border border-stone-200/90 bg-white pl-10 pr-4 text-xs text-[#181700] placeholder:text-stone-400 outline-none transition-all focus:border-[#181700] focus:ring-4 focus:ring-[#f7f000]/30 shadow-2xs"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Baris 2: Segmented Status Track + Visibility Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Segmented Pill Track Status */}
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-0 bg-stone-100/90 p-1 rounded-full w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'rounded-full py-2 px-3.5 text-xs text-center transition-all cursor-pointer',
                statusFilter === 'ALL'
                  ? 'bg-[#181700] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-[#181700] font-medium'
              )}
            >
              Semua ({initialRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FINALIZED')}
              className={cn(
                'rounded-full py-2 px-3.5 text-xs text-center transition-all cursor-pointer',
                statusFilter === 'FINALIZED'
                  ? 'bg-[#181700] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-[#181700] font-medium'
              )}
            >
              Final ({initialRecords.filter((r) => r.status === 'FINALIZED').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={cn(
                'rounded-full py-2 px-3.5 text-xs text-center transition-all cursor-pointer',
                statusFilter === 'DRAFT'
                  ? 'bg-[#181700] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-[#181700] font-medium'
              )}
            >
              Draft ({initialRecords.filter((r) => r.status === 'DRAFT').length})
            </button>
          </div>

          {/* Visibility Switcher */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setVisibilityFilter(visibilityFilter === 'VISIBLE' ? 'ALL' : 'VISIBLE')}
              className={cn(
                'h-9 rounded-full border px-4 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                visibilityFilter === 'VISIBLE'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white border-stone-200/90 text-stone-500 hover:border-stone-300'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Akses Pasien</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter(visibilityFilter === 'INTERNAL' ? 'ALL' : 'INTERNAL')}
              className={cn(
                'h-9 rounded-full border px-4 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                visibilityFilter === 'INTERNAL'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white border-stone-200/90 text-stone-500 hover:border-stone-300'
              )}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Internal Terapis</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. COMPACT CLINICAL REKAM MEDIS CARDS GRID ── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center">
          <Activity className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="mt-3 text-sm font-bold text-[#181700]">Belum ada evaluasi klinis yang sesuai</h3>
          <p className="mt-1 text-xs text-stone-500">Silakan ubah filter pencarian atau buat evaluasi baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
          {filtered.map((record) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              canEdit={canEdit}
              onSelect={() => setSelectedRecord(record)}
              onEdit={() => setEditingRecord(record)}
            />
          ))}
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
              {selectedRecord.status === 'FINALIZED' ? 'Final Terkunci' : 'Draft'}
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
                  ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs'
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
                  ? 'bg-[var(--hafta-ylw-100)] text-[#181700] shadow-2xs'
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
                    setEditingRecord(record);
                  }}
                  className="h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)] text-[#181700] font-bold text-xs sm:text-[13px] inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              )}
              <MedicalRecordActions record={selectedRecord as any} />
            </div>
          ) : null
        }
      >
        {selectedRecord && (
          <div>
            {/* Standalone Full-bleed Edge Banner */}
            <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-5 border-b border-stone-200/80 bg-[#FEFEF6] px-5 py-4 sm:px-6 sm:py-4.5 text-xs text-stone-600">
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

            <div className="mt-6 space-y-5">
              {activeTab === 'soap' ? (
                <>
                  {/* Subjective (Anamnesis) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-2xs space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      S — Subjective (Anamnesis &amp; Keluhan Pasien)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.anamnesis || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Objective (Pemeriksaan Fisik) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-2xs space-y-1.5">
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
                  <div className="rounded-2xl border border-[var(--hafta-ylw-200)]/80 bg-[var(--hafta-ylw-50)]/30 p-4.5 shadow-2xs space-y-1.5">
                    <span className="font-bold text-xs text-[var(--hafta-ylw-950)] block">
                      A — Assessment &amp; Kesimpulan Klinis
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedRecord.diagnosis || <span className="text-stone-400 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Plan (Tindakan Terapi) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-2xs space-y-1.5">
                    <span className="font-bold text-xs text-[#181700] block">
                      P — Plan (Modalitas, Terapi Manual, &amp; Intervensi Latihan)
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.treatment || <span className="text-stone-300 italic">Tidak ada catatan</span>}
                    </p>
                  </div>

                  {/* Home Exercise & Follow up */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 shadow-2xs space-y-1.5">
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
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs space-y-4">
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

      <MedicalRecordFormDrawer
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        patientOptions={patientOptions}
      />
    </div>
  );
}
