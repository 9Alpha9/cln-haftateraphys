'use client';

import { useRef, useState } from 'react';
import { FileDown, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { pdf } from '@react-pdf/renderer';
import { MedicalRecordDocument, type MedicalRecordPdfData } from '@/components/pdf/medical-record-document';

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

export function MedicalRecordActions({ record }: { record: MedicalRecordPdfData }) {
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

  return (
    <div className="flex items-center gap-2">
      <iframe ref={iframeRef} className="hidden" title="Print Frame" />
      <Button type="button" variant="outline" size="sm" disabled={printing} className="h-9 gap-1.5 rounded-xl border-[#E9E2D8] bg-white px-3 text-[12px] font-semibold text-[#1F2937] hover:bg-[#FFF7ED]" onClick={() => void openPrintPage()}>
        {printing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D97706]" />
        ) : (
          <Printer className="h-3.5 w-3.5 text-[#D97706]" />
        )}
        {printing ? 'Mencetak...' : 'Print'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        className="h-9 gap-1.5 rounded-xl border-[#F28C28]/20 bg-[#FFF7ED] px-3 text-[12px] font-semibold text-[#D97706] hover:bg-[#FFF0DB]"
        onClick={() => void downloadPdf()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D97706]" />
        ) : (
          <FileDown className="h-3.5 w-3.5 text-[#D97706]" />
        )}
        {loading ? 'Memproses...' : 'Unduh PDF'}
      </Button>
    </div>
  );
}
