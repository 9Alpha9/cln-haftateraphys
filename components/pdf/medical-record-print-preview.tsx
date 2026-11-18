'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Printer, X } from 'lucide-react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName, renderMedicalRecordPdf } from './render-medical-record-pdf';
import { fetchRecordAttachmentImages } from '@/server/actions/record-attachments';
import { closePrintPreview, openPrintPreviewTab } from '@/components/print/print-iframe';

type Stage = 'rendering' | 'ready' | 'error';

/**
 * Pratinjau PDF rekam medis.
 *
 * PDF wajib dirender pada iframe **satu tingkat** di dokumen teratas (modal),
 * bukan di dalam iframe halaman print, karena Chromium tidak membuka plugin PDF
 * pada iframe bertingkat (overlay → halaman print → PDF) sehingga frame tampak
 * kosong. Blob PDF dimuat pada iframe langsung dan tombol Cetak memanggil
 * `contentWindow.print()` pada viewer itu.
 */
export function MedicalRecordPrintPreview({
  record,
  onClose,
  openInTabHref,
  hideCloseButton = false,
}: {
  record: MedicalRecordPdfData;
  /** Aksi tutup milik pemanggil; default menutup overlay cetak global. */
  onClose?: () => void;
  /** Bila diisi, "Buka di tab" membuka halaman print asli, bukan blob. */
  openInTabHref?: string;
  /** Disembunyikan saat modal induk sudah punya tombol tutup sendiri. */
  hideCloseButton?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('rendering');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [attempt, setAttempt] = useState(0);
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
  }, [record, attempt]);

  const canPrint = stage === 'ready' && pdfUrl !== null;

  function retry() {
    setStage('rendering');
    setPdfUrl(null);
    setAttempt((value) => value + 1);
  }

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
          {openInTabHref ? (
            <a
              href={openInTabHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka di tab
            </a>
          ) : pdfUrl ? (
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
        {hideCloseButton ? null : (
          <button
            type="button"
            onClick={onClose ?? closePrintPreview}
            aria-label="Tutup pratinjau cetak"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="border-b border-border bg-[var(--hafta-50)] px-3 py-1.5 text-[10.5px] text-muted-foreground sm:px-4">
        Jika pratinjau kosong, gunakan <span className="font-semibold">Unduh PDF</span> atau{' '}
        <span className="font-semibold">Buka di tab</span>.
      </p>
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
              Data rekam medis tidak berubah. Coba lagi, atau buka tab pratinjau bila masalah
              berulang.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-[#181700] transition-colors hover:bg-[var(--hafta-400)]"
            >
              Coba lagi
            </button>
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
