'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2, Printer, TriangleAlert } from 'lucide-react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { medicalRecordFileName, renderMedicalRecordPdf } from './render-medical-record-pdf';

/**
 * Halaman cetak memakai renderer yang sama dengan tombol Unduh PDF. Dengan
 * begitu hasil cetak dan unduhan selalu identik, termasuk footer pengesahan.
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const blob = await renderMedicalRecordPdf(record);
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

  useEffect(() => {
    if (status !== 'ready' || !blobUrl) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = blobUrl;
    iframe.onload = () => {
      window.setTimeout(() => iframe.contentWindow?.print(), 350);
    };
  }, [status, blobUrl]);

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
    <div className="min-h-screen bg-stone-50 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={backHref}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {blobUrl ? (
            <>
              <button
                type="button"
                onClick={() => iframeRef.current?.contentWindow?.print()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700] hover:bg-[var(--hafta-org-200)]"
              >
                <FileDown className="h-4 w-4" />
                Unduh PDF
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200/80 bg-white p-5 sm:p-6">
        {status === 'loading' ? (
          <div className="flex min-h-[46vh] flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            <p className="mt-3 text-sm font-semibold text-[#181700]">Menyiapkan dokumen PDF…</p>
            <p className="mt-1 text-xs text-stone-500">
              Isi dokumen disusun dari data rekam medis yang sama dengan tampilan pasien.
            </p>
          </div>
        ) : status === 'error' ? (
          <div className="flex min-h-[46vh] flex-col items-center justify-center text-center">
            <TriangleAlert className="h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-[#181700]">Dokumen gagal dibuat</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              Coba muat ulang halaman. Bila berulang, gunakan tombol unduh dari halaman rekam medis
              atau hubungi tim Hafta.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--hafta-org-100)] px-4 text-xs font-bold text-[#181700]"
            >
              Muat ulang
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-stone-500">
              Pratinjau PDF ditampilkan di bawah. Dialog cetak akan terbuka otomatis.
            </p>
            <iframe
              ref={iframeRef}
              title="Pratinjau rekam medis PDF"
              className="mt-3 h-[70vh] w-full rounded-xl border border-stone-200"
            />
          </div>
        )}
      </div>
    </div>
  );
}
