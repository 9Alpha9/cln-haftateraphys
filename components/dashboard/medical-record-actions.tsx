'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreVertical, FileDown, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { pdf } from '@react-pdf/renderer';
import { MedicalRecordDocument, type MedicalRecordPdfData } from '@/components/pdf/medical-record-document';

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

export function useMedicalRecordPdf(record: MedicalRecordPdfData) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { showToast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openPrintPage = async () => {
    setPrinting(true);
    try {
      const blob = await pdf(<MedicalRecordDocument record={record} />).toBlob();
      const url = URL.createObjectURL(blob);

      if (iframeRef.current) {
        iframeRef.current.src = url;
        iframeRef.current.onload = () => {
          iframeRef.current?.contentWindow?.print();
          setPrinting(false);
        };
      } else {
        window.location.href = url;
        setPrinting(false);
      }
    } catch {
      showToast('error', 'Gagal memproses file PDF untuk dicetak.');
      setPrinting(false);
    }
  };

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const blob = await pdf(<MedicalRecordDocument record={record} />).toBlob();
      const url = URL.createObjectURL(blob);

      const date = new Date(record.recordedAt);
      const datePart = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const filename = `Hafta Fisioterapi - ${safeFilePart(record.patientName)} - ${record.id.slice(0, 8).toUpperCase()} - ${datePart}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Gagal memproses file PDF.');
    } finally {
      setLoading(false);
    }
  };

  return { openPrintPage, downloadPdf, loading, printing };
}

export function MedicalRecordActions({ record, className }: { record: MedicalRecordPdfData; className?: string }) {
  const { openPrintPage, downloadPdf, loading, printing } = useMedicalRecordPdf(record);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar panel (rule #4)
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    // Rule #2: wrapper relative inline-flex dalam pohon DOM yang sama dengan tombol pemicu
    <div ref={menuRef} className={`relative sm:inline-flex shrink-0 ${className ?? ''}`}>
      {/* Rule #2: tombol pemicu (tidak ada Portal/fixed/getBoundingClientRect) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={loading || printing}
        className="h-10 px-3 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 text-xs sm:text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:border-[#181700] focus-visible:ring-4 focus-visible:ring-[#f7f000]/35 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MoreVertical className="w-4 h-4 shrink-0" />
        {/* <span className="hidden sm:inline">Aksi Lebih Banyak</span> */}
      </button>

      {/* Rule #2: panel absolute menempel di atas tombol, dalam DOM yang sama */}
      {isOpen && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-48 origin-bottom-right rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              void openPrintPage();
            }}
            disabled={printing}
            className="hover:bg-stone-50 cursor-pointer rounded-full font-medium flex items-center gap-2 w-full px-3 py-2 text-left text-xs sm:text-sm text-stone-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              {printing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-stone-500" />
              ) : (
                <Printer className="h-3.5 w-3.5 shrink-0 text-stone-500" />
              )}
              <span className="font-medium text-xs">{printing ? 'Mencetak...' : 'Cetak Dokumen'}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              void downloadPdf();
            }}
            disabled={loading}
            className="hover:bg-stone-50 cursor-pointer rounded-full font-medium flex items-center gap-2 w-full px-3 py-2 text-left text-xs sm:text-sm text-stone-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-stone-500" />
              ) : (
                <FileDown className="h-3.5 w-3.5 shrink-0 text-stone-500" />
              )}
              <span className="font-medium text-xs">{loading ? 'Memproses...' : 'Unduh PDF'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
