import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTherapyProgressById } from '@/server/queries/therapy-progress';
import { PrintTrigger } from '@/components/dashboard/print-trigger';
import { PrintFooter } from '@/components/ui/print-footer';

function calculateAge(dob: Date | string | null | undefined): string {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} tahun`;
}

function formatGender(gender: string | null | undefined): string {
  if (gender === 'MALE') return 'Laki-laki';
  if (gender === 'FEMALE') return 'Perempuan';
  if (gender === 'OTHER') return 'Lainnya';
  return gender || '-';
}

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

  if (!record) notFound();

  const formattedDate = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const scoreSummary = `Nyeri ${record.painScore}/10 · ROM ${record.rangeOfMotionScore}/10 · Kekuatan ${record.strengthScore}/10 · Fungsi ${record.functionScore}/10`;

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8 print:bg-white print:p-0">
      <PrintTrigger mode={mode} patientName={record.patientName} recordId={record.id} recordedAt={record.recordedAt} medicalRecordNumber={record.medicalRecordNumber} />
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col border border-stone-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(24,23,0,0.05)] print:max-w-none print:min-h-screen print:print:border-none print:p-0 print:shadow-none sm:p-8">
        <div className="flex flex-col gap-4 border-b border-stone-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={140}
              height={60}
              className="self-start h-14 w-auto shrink-0 object-contain object-left-top"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-[#181700]">HAFTA FISIOTERAPI</h1>
              <p className="text-xs font-medium text-stone-500">Klinik & Layanan Terapi Fisik Profesional</p>
              <p className="text-xs text-stone-500">Jl. Pd. Sidokare Indah No.AE-13, Sidokare, Sidoarjo 61214 • WhatsApp: 0812-3293-2872</p>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex border border-stone-300 bg-white px-3 py-1 text-[10px] font-bold text-[#181700]">
              REKAM MEDIS FISIOTERAPI
            </span>
            <p className="mt-2 font-mono text-[10px] text-stone-400">ID: {record.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            Identitas Pasien
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-stone-200/80 bg-stone-200/80 text-sm sm:grid-cols-2">
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">No. RM</span>
              <span className="mt-0.5 block font-mono text-sm font-bold text-[#181700]">{record.medicalRecordNumber || '-'}</span>
            </div>
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">Nama Pasien</span>
              <span className="mt-0.5 block font-bold text-[#181700]">{record.patientName}</span>
            </div>
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">Umur</span>
              <span className="mt-0.5 block text-[#181700]">{calculateAge(record.patientDob)}</span>
            </div>
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">Jenis Kelamin</span>
              <span className="mt-0.5 block text-[#181700]">{formatGender(record.gender)}</span>
            </div>
            <div className="bg-white p-3 sm:col-span-2">
              <span className="block text-[10px] font-medium text-stone-500">Alamat</span>
              <span className="mt-0.5 block text-[#181700]">{record.patientAddress || '-'}</span>
            </div>
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">Nomor HP</span>
              <span className="mt-0.5 block text-[#181700]">{record.patientPhone || '-'}</span>
            </div>
            <div className="bg-white p-3">
              <span className="block text-[10px] font-medium text-stone-500">Terapis</span>
              <span className="mt-0.5 block font-semibold text-[#181700]">{record.therapistName || 'Terapis Hafta'}</span>
            </div>
            <div className="bg-white p-3 sm:col-span-2">
              <span className="block text-[10px] font-medium text-stone-500">Tanggal Pemeriksaan</span>
              <span className="mt-0.5 block font-semibold text-[#181700]">{formattedDate}</span>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            3. Anamnesa Fisioterapi
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{record.anamnesis || '-'}</p>
          {record.physicalExamination ? (
            <>
              <h3 className="mt-3 text-[11px] font-bold text-stone-600">Pemeriksaan Fisik</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{record.physicalExamination}</p>
            </>
          ) : null}
        </section>

        <section className="mt-5">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            4. Diagnosa
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{record.diagnosis || '-'}</p>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            5. Riwayat Penyakit
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{record.medicalHistory || '-'}</p>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            6. Catatan Klinis
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{record.summary || '-'}</p>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 border-l-2 border-stone-400 pl-2 text-xs font-bold uppercase tracking-wider text-[#181700]">
            7. Penatalaksanaan
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-stone-100">
                  <th className="border border-stone-200 px-3 py-2 font-bold text-stone-700">Tanggal</th>
                  <th className="border border-stone-200 px-3 py-2 font-bold text-stone-700">Terapi</th>
                  <th className="border border-stone-200 px-3 py-2 font-bold text-stone-700">Evaluasi</th>
                  <th className="border border-stone-200 px-3 py-2 font-bold text-stone-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-stone-200 px-3 py-2 align-top text-stone-800">{formattedDate}</td>
                  <td className="border border-stone-200 px-3 py-2 align-top whitespace-pre-wrap text-stone-800">{record.treatment || '-'}</td>
                  <td className="border border-stone-200 px-3 py-2 align-top text-stone-800">
                    {record.evaluation ? <span className="block whitespace-pre-wrap">{record.evaluation}</span> : null}
                    <span className="mt-1 block text-[11px] text-stone-500">{scoreSummary}</span>
                  </td>
                  <td className="border border-stone-200 px-3 py-2 align-top whitespace-pre-wrap text-stone-800">{record.followUpPlan || record.summary || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <PrintFooter signerRole="Terapis Penanggung Jawab," signerName={record.therapistName || 'Terapis Hafta'} />
      </div>
    </div>
  );
}
