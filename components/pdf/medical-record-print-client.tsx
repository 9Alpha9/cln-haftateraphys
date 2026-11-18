'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2, Printer, TriangleAlert } from 'lucide-react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName, renderMedicalRecordPdf } from './render-medical-record-pdf';
import { fetchRecordAttachmentImages } from '@/server/actions/record-attachments';

const LOADING = 'loading';

/**
 * Halaman cetak memakai renderer yang sama dengan tombol Unduh PDF.
 *
 * PDF dirender sebagai blob di client lalu dimuat ke iframe lewat state src.
 * Handler onLoad dipasang langsung pada elemen iframe, sehingga dialog cetak
 * otomatis (`?print=1`) berjalan setelah blob PDF benar-benar termuat.
 */
export function MedicalRecordPrintClient({
  record,
  backHref = '/dashboard/progress',
}: {
  record: MedicalRecordPdfData;
  backHref?: string;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const autoPrintRef = useRef(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    autoPrintRef.current = new URLSearchParams(window.location.search).get('print') === '1';
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const attachmentImages =
          record.attachmentImages !== undefined
            ? record.attachmentImages
            : await fetchRecordAttachmentImages(record.id).catch(() => []);
        const blob = await renderMedicalRecordPdf({ ...record, attachmentImages });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setStatus('ready');
        document.title = medicalRecordFileName(record).replace(/\.pdf$/i, '');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [record]);

  function printDocument() {
    if (!blobUrl) return;
    frameRef.current?.contentWindow?.print();
  }

  function handleFrameLoad() {
    if (!autoPrintRef.current) return;
    autoPrintRef.current = false;
    window.setTimeout(() => frameRef.current?.contentWindow?.print(), 350);
  }

  function download() {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = medicalRecordFileName(record);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 print:block print:bg-white">
      <div className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href={backHref}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {blobUrl ? (
              <>
                <button
                  type="button"
                  onClick={printDocument}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <Printer className="h-4 w-4" />
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-400)]"
                >
                  <FileDown className="h-4 w-4" />
                  Unduh PDF
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-0 py-0 sm:px-5 sm:py-5 print:block print:p-0">
        {status === LOADING ? (
          <div className="flex min-h-[52vh] flex-1 flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            <p className="mt-3 text-sm font-semibold text-[#181700]">Menyiapkan dokumen PDF…</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex min-h-[52vh] flex-1 flex-col items-center justify-center text-center">
            <TriangleAlert className="h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-[#181700]">Dokumen gagal dibuat</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-[#181700]"
            >
              Muat ulang
            </button>
          </div>
        ) : (
          <iframe
            ref={frameRef}
            data-pdf-preview
            src={blobUrl ?? undefined}
            title="Pratinjau rekam medis PDF"
            onLoad={handleFrameLoad}
            className="min-h-[420px] w-full flex-1 border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}
