'use client';

import { X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MedicalRecordPdfData } from './medical-record-document';
import { MedicalRecordPrintPreview } from './medical-record-print-preview';

/**
 * Pop up pratinjau cetak rekam medis.
 *
 * Shell Hafta hanya menyediakan judul, identitas pasien, dan tombol tutup.
 * Seluruh kontrol dokumen (navigasi halaman, zoom, pencarian, sidebar, cetak,
 * unduh) berasal dari PDF.js Generic Viewer resmi di dalam iframe.
 */
export function MedicalRecordPrintDialog({
  record,
  open,
  onOpenChange,
}: {
  record: MedicalRecordPdfData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[94vh] sm:w-[96vw] sm:max-w-[1400px] sm:rounded-xl sm:p-0"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-2 pr-2.5 pt-[calc(env(safe-area-inset-top)+0.5rem)] text-left sm:px-5 sm:pt-2">
          <div className="min-w-0">
            <DialogTitle className="truncate text-sm font-bold leading-tight text-foreground">
              Pratinjau Cetak Rekam Medis
            </DialogTitle>
            <DialogDescription className="truncate text-[11px] leading-snug text-muted-foreground">
              {record
                ? `${record.patientName} · Gunakan toolbar PDF untuk mencari, memperbesar, mencetak, atau mengunduh.`
                : 'Rekam medis'}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Tutup pratinjau cetak"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          {record ? <MedicalRecordPrintPreview record={record} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
