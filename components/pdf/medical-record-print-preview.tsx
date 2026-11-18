'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Printer, X } from 'lucide-react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName, renderMedicalRecordPdf } from './render-medical-record-pdf';
import { fetchRecordAttachmentImages } from '@/server/actions/record-attachments';
import { closePrintPreview, openPrintPreviewTab } from '@/components/print/print-iframe';

type Stage = 'rendering' | 'ready' | 'error';

/**
 * Pratinjau PDF rekam medis di dalam overlay cetak.
 *
 * PDF dirender langsung di overlay, bukan lewat `<iframe>` halaman print, karena
 * Chromium tidak membuka plugin PDF di iframe bertingkat (overlay → halaman
 * print → PDF). Blob PDF dimuat pada iframe langsung dan tombol Cetak memanggil
 * `contentWindow.print()` pada viewer itu.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  const [stage, setStage] = useState<Stage>('rendering');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const pdfRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const attachmentImages =
          record.attachmentImages !== undefined
            ? record.attachmentImages
            : await fetchRecordAttachmentImages(record.id).catch(() => []);
        const name = medicalRecordFileName(record);
        const blob = await renderMedicalRecordPdf({ ...record, attachmentImages });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setFileName(name);
        setStage('ready');
      } catch {
        if (!cancelled) setStage('error');
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [record]);

  const canPrint = stage === 'ready' && pdfUrl !== null;

  function printDocument() {
    pdfRef.current?.contentWindow?.print();
  }

  function download() {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName || medicalRecordFileName(record);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={printDocument}
            disabled={!canPrint}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--hafta-300)] px-3 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-400)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!canPrint}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Unduh PDF
          </button>
          {pdfUrl ? (
            <button
              type="button"
              onClick={() => openPrintPreviewTab(pdfUrl)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka di tab
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={closePrintPreview}
          aria-label="Tutup pratinjau cetak"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 bg-white">
        {stage === 'rendering' ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
            <p className="mt-3 text-xs font-semibold text-stone-600">Menyiapkan dokumen PDF…</p>
          </div>
        ) : stage === 'error' ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-semibold text-stone-800">Dokumen gagal dibuat</p>
            <p className="mt-1 max-w-sm text-xs text-stone-500">
              Tutup pratinjau, lalu coba lagi dari halaman rekam medis.
            </p>
          </div>
        ) : (
          <iframe
            ref={pdfRef}
            data-pdf-preview
            src={pdfUrl ?? undefined}
            title="Pratinjau rekam medis PDF"
            className="h-full min-h-[320px] w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}
