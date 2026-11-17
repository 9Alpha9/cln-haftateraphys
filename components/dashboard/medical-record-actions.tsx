'use client';

import { useRef, useState } from 'react';
import { MoreVertical, FileDown, Loader2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MedicalRecordPdfData } from '@/components/pdf/medical-record-document';
import { medicalRecordFileName, renderMedicalRecordPdf } from '@/components/pdf/render-medical-record-pdf';
import { recordClinicalRecordExport } from '@/server/actions/audit-export';
import { fetchRecordAttachmentImages } from '@/server/actions/record-attachments';

function mergeRecord(record: MedicalRecordPdfData, extras?: Partial<MedicalRecordPdfData>): MedicalRecordPdfData {
  return extras ? { ...record, ...extras } : record;
}

export function useMedicalRecordPdf(record: MedicalRecordPdfData, extras?: Partial<MedicalRecordPdfData>) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { showToast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const data = mergeRecord(record, extras);

  const withAttachments = async () => {
    if (data.attachmentImages !== undefined) return data;
    try {
      const attachmentImages = await fetchRecordAttachmentImages(data.id);
      return { ...data, attachmentImages };
    } catch {
      return { ...data, attachmentImages: [] };
    }
  };

  const openPrintPage = async () => {
    setPrinting(true);
    try {
      const printable = await withAttachments();
      void recordClinicalRecordExport(printable.id, 'print');
      const blob = await renderMedicalRecordPdf(printable);
      const url = URL.createObjectURL(blob);

      if (iframeRef.current) {
        iframeRef.current.src = url;
        iframeRef.current.onload = () => {
          iframeRef.current?.contentWindow?.print();
          setPrinting(false);
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        };
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        setPrinting(false);
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch {
      showToast('error', 'Gagal memproses file PDF untuk dicetak.');
      setPrinting(false);
    }
  };

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const printable = await withAttachments();
      void recordClinicalRecordExport(printable.id, 'pdf');
      const blob = await renderMedicalRecordPdf(printable);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = medicalRecordFileName(printable);
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

  return { openPrintPage, downloadPdf, loading, printing, iframeRef };
}

const SPLIT_BASE =
  'inline-flex h-11 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-all focus-visible:border-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5 sm:text-[13px]';

export function MedicalRecordActions({
  record,
  extras,
  className,
  tone = 'light',
  layout = 'menu',
  menuPlacement = 'up',
}: {
  record: MedicalRecordPdfData;
  /** Informasi terapi/rencana/program agar PDF identik dengan tampilan pasien. */
  extras?: Partial<MedicalRecordPdfData>;
  className?: string;
  tone?: 'light' | 'dark';
  /** 'menu': kebab dropdown; 'split': 2 tombol eksplisit (untuk footer drawer). */
  layout?: 'menu' | 'split';
  /** Arah panel dropdown: 'down' untuk pemicu di bagian atas kartu. */
  menuPlacement?: 'up' | 'down';
}) {
  const { openPrintPage, downloadPdf, loading, printing, iframeRef } = useMedicalRecordPdf(record, extras);

  if (layout === 'split') {
    return (
      <div className={cn('flex w-full items-center gap-2 sm:w-auto', className)}>
        <iframe
          ref={iframeRef}
          title="Dokumen cetak rekam medis"
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
        />
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
          className={`${SPLIT_BASE} bg-[var(--hafta-300)] font-bold text-foreground hover:bg-[var(--hafta-400)]`}
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
    <div className={cn('relative shrink-0 rounded-full sm:inline-flex', className)}>
      <iframe
        ref={iframeRef}
        title="Dokumen cetak rekam medis"
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={loading || printing}
          aria-label="Aksi rekam medis"
          className={
            tone === 'dark'
              ? 'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.06] p-0 text-white/80 transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:bg-white/[0.12] hover:text-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.45)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60'
              : 'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:bg-accent hover:text-foreground hover:shadow-[0_2px_10px_rgba(28,25,23,0.10)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          <MoreVertical className="w-4 h-4 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side={menuPlacement === 'down' ? 'bottom' : 'top'}
          sideOffset={8}
          className={
            tone === 'dark'
              ? 'w-48 border-white/10 bg-[#191817] p-1.5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.55)]'
              : 'w-48 p-1.5'
          }
        >
          <DropdownMenuItem
            disabled={printing}
            onClick={() => void openPrintPage()}
            className={
              tone === 'dark'
                ? 'min-h-[44px] gap-2.5 text-xs text-white/70 focus:bg-white/[0.08] focus:text-white'
                : 'min-h-[44px] gap-2.5 text-xs text-muted-foreground'
            }
          >
            {printing ? (
              <Loader2 className={tone === 'dark' ? 'h-3.5 w-3.5 animate-spin shrink-0 text-white/50' : 'h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground'} />
            ) : (
              <Printer className={tone === 'dark' ? 'h-3.5 w-3.5 shrink-0 text-white/50' : 'h-3.5 w-3.5 shrink-0 text-muted-foreground'} />
            )}
            <span className="font-medium text-xs">{printing ? 'Mencetak...' : 'Cetak Dokumen'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={loading}
            onClick={() => void downloadPdf()}
            className={
              tone === 'dark'
                ? 'min-h-[44px] gap-2.5 text-xs text-white/70 focus:bg-white/[0.08] focus:text-white'
                : 'min-h-[44px] gap-2.5 text-xs text-muted-foreground'
            }
          >
            {loading ? (
              <Loader2 className={tone === 'dark' ? 'h-3.5 w-3.5 animate-spin shrink-0 text-white/50' : 'h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground'} />
            ) : (
              <FileDown className={tone === 'dark' ? 'h-3.5 w-3.5 shrink-0 text-white/50' : 'h-3.5 w-3.5 shrink-0 text-muted-foreground'} />
            )}
            <span className="font-medium text-xs">{loading ? 'Memproses...' : 'Unduh PDF'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
