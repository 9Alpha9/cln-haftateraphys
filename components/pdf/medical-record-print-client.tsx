'use client';

import Link from 'next/link';
import type { MedicalRecordPdfData } from './medical-record-document';
import { MedicalRecordPrintPreview } from './medical-record-print-preview';

/**
 * Halaman cetak mandiri (mis. dibuka lewat tautan langsung). Isi dan tombolnya
 * identik dengan pratinjau di overlay karena keduanya memakai
 * `MedicalRecordPrintPreview`.
 */
export function MedicalRecordPrintClient({
  record,
  backHref = '/dashboard/progress',
}: {
  record: MedicalRecordPdfData;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 print:block print:bg-white">
      <div className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href={backHref}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Kembali
          </Link>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5 print:block print:p-0">
        <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
          <MedicalRecordPrintPreview record={record} />
        </div>
      </div>
    </div>
  );
}
