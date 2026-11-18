'use client';

import { useState } from 'react';
import type { MedicalRecordPdfData } from './medical-record-document';
import { LifelineLoader } from '@/components/animate-ui/lifeline-loader';

/**
 * Pratinjau PDF rekam medis.
 *
 * Berkas diambil dari endpoint `/dashboard/progress/[recordId]/pdf` (bukan blob
 * dari renderer klien) supaya viewer PDF browser menerima header
 * `Content-Disposition` dan tombol unduh di dalam viewer menyimpan berkas dengan
 * nama rekam medis yang benar.
 *
 * Endpoint merender PDF di server sehingga butuh beberapa saat; selama menunggu,
 * lapisan animasi lifeline menutupi area iframe agar pengguna tahu dokumen sedang
 * disiapkan.
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  const src = `/dashboard/progress/${record.id}/pdf`;
  // Menyimpan sumber yang sudah selesai dimuat: ketika rekam berganti, `src`
  // ikut berubah sehingga animasi tampil kembali tanpa perlu effect.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loading = loadedSrc !== src;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <iframe
        key={src}
        data-pdf-preview
        src={src}
        title="Pratinjau rekam medis PDF"
        onLoad={() => setLoadedSrc(src)}
        className="h-full min-h-[320px] w-full border-0 bg-white"
      />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <LifelineLoader />
        </div>
      ) : null}
    </div>
  );
}
