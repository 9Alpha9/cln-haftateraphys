'use client';

import { useState } from 'react';
import { useReportContext } from '@/lib/report-context';

export function ReportDialog() {
  const { open, setOpen, reason, setReason } = useReportContext();
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setReason('');
    }, 1500);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {submitted ? (
          <p className="text-sm text-green-700">Laporan Anda telah terkirim. Terima kasih!</p>
        ) : (
          <>
            <h2 className="text-lg font-bold">Laporkan Masalah</h2>
            <p className="mt-2 text-sm text-stone-600">Jelaskan masalah yang Anda alami. Laporan ini tidak memuat data rekam medis.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-4 w-full rounded-xl border border-stone-300 p-3 text-sm"
              rows={4}
              placeholder="Tuliskan masalah di sini..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Batal</button>
              <button type="button" className="btn-primary" onClick={submit} disabled={!reason.trim()}>Kirim</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
