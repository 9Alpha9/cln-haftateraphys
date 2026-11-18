'use client';

import {
  Dialog,
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
 * PDF dirender pada iframe satu tingkat di dokumen teratas. Sebelumnya tombol
 * cetak membuka overlay yang memuat halaman `/dashboard/progress/[id]/print`
 * lewat iframe, sehingga PDF berada di iframe bertingkat dan tampil kosong di
 * Chromium. Halaman print asli tetap tersedia lewat tombol "Buka di tab".
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
      <DialogContent className="flex h-[92dvh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-[88vh]">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pr-12 text-left">
          <DialogTitle className="truncate text-sm font-bold text-foreground">
            Pratinjau Cetak Rekam Medis
          </DialogTitle>
          <DialogDescription className="truncate text-[11px] text-muted-foreground">
            {record
              ? `${record.patientName} · Cetak atau unduh langsung dari pratinjau ini.`
              : 'Rekam medis'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          {record ? (
            <MedicalRecordPrintPreview
              record={record}
              hideCloseButton
              openInTabHref={`/dashboard/progress/${record.id}/print`}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
