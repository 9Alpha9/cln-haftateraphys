'use client';

import { useRef, useState } from 'react';
import { FileDown, Printer, Loader2 } from 'lucide-react';
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

export function MedicalRecordPrintButton({ record, className }: { record: MedicalRecordPdfData; className?: string }) {
  const { openPrintPage, printing } = useMedicalRecordPdf(record);
  return (
    <button
      type="button"
      disabled={printing}
      onClick={() => void openPrintPage()}
      className={`
        h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-stone-100 text-[#181700] border border-stone-200/90 text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap
        disabled:cursor-not-allowed disabled:opacity-60
        ${className ?? ''}
      `}
    >
      {printing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Printer className="h-3.5 w-3.5" />
      )}
      <span>{printing ? 'Mencetak...' : 'Print'}</span>
    </button>
  );
}

export function MedicalRecordDownloadButton({ record, className }: { record: MedicalRecordPdfData; className?: string }) {
  const { downloadPdf, loading } = useMedicalRecordPdf(record);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void downloadPdf()}
      className={`
        h-10 sm:h-11 px-5 rounded-full bg-[var(--hafta-ylw-50)]/70 hover:bg-[var(--hafta-ylw-100)] text-[#181700] border border-[var(--hafta-ylw-200)] text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap
        disabled:cursor-not-allowed disabled:opacity-60
        ${className ?? ''}
      `}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      <span>{loading ? 'Memproses...' : 'Unduh PDF'}</span>
    </button>
  );
}

export function MedicalRecordActions({ record }: { record: MedicalRecordPdfData }) {
  return (
    <>
      <MedicalRecordPrintButton record={record} />
      <MedicalRecordDownloadButton record={record} />
    </>
  );
}
