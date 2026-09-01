import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTherapyProgressById } from '@/server/queries/therapy-progress';
import { PrintTrigger } from '@/components/dashboard/print-trigger';

export default async function PrintMedicalRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ mode?: 'print' | 'pdf' }>;
}) {
  const { recordId } = await params;
  const { mode = 'print' } = await searchParams;
  const record = await getTherapyProgressById(recordId);

  if (!record) {
    notFound();
  }

  const formattedDate = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 print:bg-white print:p-0">
      <PrintTrigger mode={mode} patientName={record.patientName} recordId={record.id} recordedAt={record.recordedAt} />
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
        {/* Kop Surat Header */}
        <div className="flex items-center justify-between border-b-2 border-accent/30 pb-5">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={140}
              height={60}
              className="h-18 w-auto object-cover"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">HAFTA FISIOTERAPI</h1>
              <p className="text-xs text-slate-500">Klinik & Layanan Terapi Fisik Profesional</p>
              <p className="text-xs text-slate-500">Jl. Operasional Klinik No. 8, Indonesia • Telp: (021) 555-0199</p>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded bg-accent/15 text-[#92400e] print:border print:border-accent/30">
              REKAM MEDIS RESMI
            </span>
            <p className="mt-2 font-mono text-xs text-slate-400">ID: {record.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Identitas Pasien & Waktu Pelayanan */}
        <div className="mt-6 rounded-lg bg-slate-50 p-4 print:bg-slate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Pasien & Waktu Pelayanan</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Nama Pasien</span>
              <span className="font-semibold text-slate-900">{record.patientName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Tanggal Pelayanan</span>
              <span className="font-semibold text-slate-900">{formattedDate}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Nomor Telepon</span>
              <span className="text-slate-800">{record.patientPhone || '-'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Terapis Penanggung Jawab</span>
              <span className="font-semibold text-slate-900">{record.therapistName || 'Terapis Hafta'}</span>
            </div>
          </div>
        </div>

        {/* Skor Evaluasi Fisik */}
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Ringkasan Parameter Fisik</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-lg border border-slate-200 p-3">
              <span className="text-xs text-slate-500 block">Skor Nyeri</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{record.painScore} <span className="text-xs font-normal text-slate-400">/ 10</span></span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <span className="text-xs text-slate-500 block">Lingkup Gerak (ROM)</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{record.rangeOfMotionScore} <span className="text-xs font-normal text-slate-400">/ 10</span></span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <span className="text-xs text-slate-500 block">Kekuatan Otot</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{record.strengthScore} <span className="text-xs font-normal text-slate-400">/ 10</span></span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <span className="text-xs text-slate-500 block">Fungsi Tubuh</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{record.functionScore} <span className="text-xs font-normal text-slate-400">/ 10</span></span>
            </div>
          </div>
        </div>

        {/* Isian Klinis Terstruktur */}
        <div className="mt-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">Catatan & Diagnosa Klinis</h2>

          {record.anamnesis && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">1. Anamnesis (Keluhan Utama & Riwayat)</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{record.anamnesis}</p>
            </div>
          )}

          {record.physicalExamination && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">2. Pemeriksaan Fisik & Penunjang</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{record.physicalExamination}</p>
            </div>
          )}

          {record.diagnosis && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">3. Diagnosis Fisioterapi</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800 font-semibold">{record.diagnosis}</p>
            </div>
          )}

          {record.treatment && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">4. Pengobatan & Tindakan Diberikan</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{record.treatment}</p>
            </div>
          )}

          {record.followUpPlan && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">5. Rencana Tindak Lanjut & Edukasi</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{record.followUpPlan}</p>
            </div>
          )}

          {record.summary && (
            <div>
              <h3 className="text-xs font-bold text-slate-700">6. Ringkasan Tambahan</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{record.summary}</p>
            </div>
          )}
        </div>

        {/* Tanda Tangan & Paraf Terapis */}
        <div className="mt-12 flex justify-between items-end border-t border-slate-200 pt-6">
          <div className="text-xs text-slate-400">
            <p>Dokumen ini disahkan secara digital oleh Klinik Hafta Fisioterapi.</p>
            <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
          <div className="text-center w-48">
            <p className="text-xs text-slate-500">Terapis Penanggung Jawab,</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-xs italic text-slate-300">[Tanda Tangan & Paraf]</span>
            </div>
            <p className="text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">{record.therapistName || 'Terapis Hafta'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
