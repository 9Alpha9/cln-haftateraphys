'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
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
 * Di desktop, toolbar viewer (cetak/unduh) tersedia sendiri. Di iOS Safari
 * viewer PDF tidak punya toolbar dan hanya merender isi dokumen, sehingga pada
 * layar kecil ditambahkan bilah aksi sendiri (Unduh + Cetak/Bagikan).
 */
export function MedicalRecordPrintPreview({ record }: { record: MedicalRecordPdfData }) {
  const src = `/dashboard/progress/${record.id}/pdf`;
  // Menyimpan sumber yang sudah selesai dimuat: ketika rekam berganti, `src`
  // ikut berubah sehingga animasi tampil kembali tanpa perlu effect.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loading = loadedSrc !== src;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Toolbar khusus mobile: iOS tidak menyediakan tombol cetak/unduh pada
          PDF di dalam iframe. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2 md:hidden">
        <a
          href={src}
          download
          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--hafta-300)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--hafta-400)]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Unduh PDF
        </a>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Cetak / Bagikan
        </a>
      </div>

      <div className="relative min-h-0 flex-1">
        <iframe
          key={src}
          data-pdf-preview
          src={src}
          title="Pratinjau rekam medis PDF"
          className="h-full min-h-[320px] w-full border-0 bg-white"
        />
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <LifelineLoader />
          </div>
        ) : null}
      </div>
    </div>
  );
}
