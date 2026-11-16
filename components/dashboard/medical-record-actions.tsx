'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreVertical, FileDown, Loader2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { pdf } from '@react-pdf/renderer';
import { MedicalRecordDocument, type MedicalRecordPdfData } from '@/components/pdf/medical-record-document';
import { recordClinicalRecordExport } from '@/server/actions/audit-export';

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

export function useMedicalRecordPdf(record: MedicalRecordPdfData) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { showToast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openPrintPage = async () => {
    setPrinting(true);
    try {
      void recordClinicalRecordExport(record.id, 'print');
      const blob = await pdf(<MedicalRecordDocument record={record} />).toBlob();
      const url = URL.createObjectURL(blob);

      if (iframeRef.current) {
        iframeRef.current.src = url;
        iframeRef.current.onload = () => {
          iframeRef.current?.contentWindow?.print();
          setPrinting(false);
        };
      } else {
        window.location.href = url;
        setPrinting(false);
      }
    } catch {
      showToast('error', 'Gagal memproses file PDF untuk dicetak.');
      setPrinting(false);
    }
  };

  const downloadPdf = async () => {
    setLoading(true);
    try {
      void recordClinicalRecordExport(record.id, 'pdf');
      const blob = await pdf(<MedicalRecordDocument record={record} />).toBlob();
      const url = URL.createObjectURL(blob);

      const date = new Date(record.recordedAt);
      const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const rmPart = safeFilePart(record.medicalRecordNumber || record.id.slice(0, 8).toUpperCase());
      const filename = `${safeFilePart(record.patientName)}-${rmPart}-${datePart}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Gagal memproses file PDF.');
    } finally {
      setLoading(false);
    }
  };

  return { openPrintPage, downloadPdf, loading, printing };
}

const SPLIT_BASE =
  'inline-flex h-11 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-all focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5 sm:text-[13px]';

export function MedicalRecordActions({
  record,
  className,
  tone = 'light',
  layout = 'menu',
  menuPlacement = 'up',
}: {
  record: MedicalRecordPdfData;
  className?: string;
  tone?: 'light' | 'dark';
  /** 'menu': kebab dropdown; 'split': 2 tombol eksplisit (untuk footer drawer). */
  layout?: 'menu' | 'split';
  /** Arah panel dropdown: 'down' untuk pemicu di bagian atas kartu. */
  menuPlacement?: 'up' | 'down';
}) {
  const { openPrintPage, downloadPdf, loading, printing } = useMedicalRecordPdf(record);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar panel (rule #4)
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (layout === 'split') {
    return (
      <div className={cn('flex w-full items-center gap-2 sm:w-auto', className)}>
        <button
          type="button"
          onClick={() => void openPrintPage()}
          disabled={printing}
          className={`${SPLIT_BASE} border border-border bg-card text-foreground hover:bg-accent`}
        >
          {printing ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Printer className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {printing ? 'Mencetak...' : 'Cetak'}
        </button>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={loading}
          className={`${SPLIT_BASE} bg-[var(--hafta-org-100)] font-bold text-foreground hover:bg-[var(--hafta-org-200)]`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground/60" />
          ) : (
            <FileDown className="h-4 w-4 shrink-0" />
          )}
          {loading ? 'Memproses...' : 'Unduh PDF'}
        </button>
      </div>
    );
  }

  return (
    // Rule #2: wrapper relative inline-flex dalam pohon DOM yang sama dengan tombol pemicu
    <div ref={menuRef} className={`relative sm:inline-flex shrink-0 rounded-full ${className ?? ''}`}>
      {/* Rule #2: tombol pemicu (tidak ada Portal/fixed/getBoundingClientRect) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={loading || printing}
        aria-label="Aksi rekam medis"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={
          tone === 'dark'
            ? 'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-0 text-white/80 transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:bg-white/[0.12] hover:text-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.45)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60'
            : 'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:bg-accent hover:text-foreground hover:shadow-[0_2px_10px_rgba(28,25,23,0.10)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        <MoreVertical className="w-4 h-4 shrink-0" />
        {/* <span className="hidden sm:inline">Aksi Lebih Banyak</span> */}
      </button>

      {/* Rule #2: panel absolute menempel di atas tombol, dalam DOM yang sama */}
      {isOpen && (
        <div
          className={
            tone === 'dark'
              ? `absolute ${menuPlacement === 'down' ? 'top-full mt-2 origin-top-right' : 'bottom-full mb-2 origin-bottom-right'} right-0 z-20 flex w-48 flex-col gap-1 rounded-2xl border border-white/10 bg-[#191817] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.55)]`
              : `absolute ${menuPlacement === 'down' ? 'top-full mt-2 origin-top-right' : 'bottom-full mb-2 origin-bottom-right'} right-0 z-20 flex w-48 flex-col gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-[0_1px_2px_rgba(28,25,23,0.06),0_12px_32px_-16px_rgba(28,25,23,0.18)]`
          }
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              void openPrintPage();
            }}
            disabled={printing}
            className={
              tone === 'dark'
                ? 'flex w-full min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:text-sm'
                : 'flex w-full min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--hafta-50)] hover:text-foreground sm:text-sm'
            }
          >
            <div className="flex items-center gap-2">
              {printing ? (
                <Loader2 className={tone === 'dark' ? 'h-3.5 w-3.5 animate-spin shrink-0 text-white/50' : 'h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground'} />
              ) : (
                <Printer className={tone === 'dark' ? 'h-3.5 w-3.5 shrink-0 text-white/50' : 'h-3.5 w-3.5 shrink-0 text-muted-foreground'} />
              )}
              <span className="font-medium text-xs">{printing ? 'Mencetak...' : 'Cetak Dokumen'}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              void downloadPdf();
            }}
            disabled={loading}
            className={
              tone === 'dark'
                ? 'flex w-full min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:text-sm'
                : 'flex w-full min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--hafta-50)] hover:text-foreground sm:text-sm'
            }
          >
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className={tone === 'dark' ? 'h-3.5 w-3.5 animate-spin shrink-0 text-white/50' : 'h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground'} />
              ) : (
                <FileDown className={tone === 'dark' ? 'h-3.5 w-3.5 shrink-0 text-white/50' : 'h-3.5 w-3.5 shrink-0 text-muted-foreground'} />
              )}
              <span className="font-medium text-xs">{loading ? 'Memproses...' : 'Unduh PDF'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
