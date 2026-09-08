'use client';

import { useRef, useState } from 'react';
import { FileDown, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { pdf } from '@react-pdf/renderer';
import { IntakeHistoryDocument } from '@/components/pdf/intake-history-document';
import { getIntakeForPdf } from '@/server/actions/intake-pdf';
import type { IntakeHistoryPdfData } from '@/server/queries/patient-intakes';

function safeFilePart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

export function IntakeHistoryActions({
  intakeId,
  patientName,
  submittedAt,
}: {
  intakeId: string;
  patientName: string;
  submittedAt: Date | null;
}) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { showToast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function fetchData(): Promise<IntakeHistoryPdfData | null> {
    try {
      return await getIntakeForPdf(intakeId);
    } catch {
      showToast('error', 'Gagal mengambil data intake untuk PDF.');
      return null;
    }
  }

  const openPrintPage = async () => {
    setPrinting(true);
    try {
      const data = await fetchData();
      if (!data) {
        setPrinting(false);
        return;
      }
      const blob = await pdf(<IntakeHistoryDocument data={data} />).toBlob();
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
      const data = await fetchData();
      if (!data) {
        setLoading(false);
        return;
      }
      const blob = await pdf(<IntakeHistoryDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      const datePart = submittedAt
        ? new Date(submittedAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
      const filename = `Hafta Fisioterapi - ${safeFilePart(patientName)} - Form Awal - ${datePart}.pdf`;

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
    <div className="flex items-center gap-1.5">
      <iframe ref={iframeRef} className="hidden" title="Print Frame" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={printing}
        className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => void openPrintPage()}
      >
        {printing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Printer className="h-3.5 w-3.5" />
        )}
        {printing ? '...' : 'Cetak'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => void downloadPdf()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="h-3.5 w-3.5" />
        )}
        {loading ? '...' : 'Unduh PDF'}
      </Button>
    </div>
  );
}
