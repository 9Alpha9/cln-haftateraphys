'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { renderMedicalRecordPdf } from './render-medical-record-pdf';
import { fetchRecordAttachmentImages } from '@/server/actions/record-attachments';

type Stage = 'rendering' | 'ready' | 'error';

/**
 * Pratinjau PDF rekam medis.
 *
 * PDF dirender pada iframe **satu tingkat** di dokumen teratas (modal). Chromium
 * tidak membuka plugin PDF pada iframe bertingkat, sehingga pratinjau tampak
 * kosong bila dibungkus lagi oleh iframe halaman print. Cetak dan unduh memakai
 * toolbar bawaan viewer PDF, jadi komponen ini tidak menambah tombol sendiri.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  const [stage, setStage] = useState<Stage>('rendering');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const attachmentImages =
          record.attachmentImages !== undefined
            ? record.attachmentImages
            : await fetchRecordAttachmentImages(record.id).catch(() => []);
        const blob = await renderMedicalRecordPdf({ ...record, attachmentImages });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
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

  function retry() {
    setStage('rendering');
    setPdfUrl(null);
    setAttempt((value) => value + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
              Data rekam medis tidak berubah. Coba lagi beberapa saat lagi.
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
