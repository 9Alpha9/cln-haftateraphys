import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * Skala tipografi dokumen (pt). Ukuran dibuat ringkas agar teks panjang tetap
 * muat tanpa terpotong: header 17 bold, judul bagian 11 bold, isi 10 regular,
 * line-height 1.45. Semua ukuran turunan dihitung dari skala ini agar satu
 * perubahan menjaga konsistensi seluruh dokumen.
 */
const FONT = {
  header: 17,
  title: 11,
  body: 10,
  lineHeight: 1.45,
} as const;
const FONT_SUB = 9;
const FONT_META = 8;
const FONT_TABLE = 9;

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingHorizontal: 38,
    paddingBottom: 64,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: FONT.body,
    lineHeight: FONT.lineHeight,
    color: '#1c1917',
    flexDirection: 'column',
  },
  pageContent: { flexGrow: 1 },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerIdentity: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  headerLogo: { width: 94, height: 38, objectFit: 'contain', marginLeft: -14, marginRight: 8, marginTop: -4, alignSelf: 'flex-start' },
  headerClinic: { flex: 1 },
  clinicName: { fontSize: FONT.header, fontFamily: 'Helvetica-Bold', color: '#181700', lineHeight: 1.2, marginBottom: 2 },
  clinicInfo: { fontSize: FONT_META, color: '#57534e', lineHeight: 1.5 },
  badgeBox: { alignItems: 'flex-end', marginLeft: 10 },
  badge: {
    fontSize: FONT_META,
    fontFamily: 'Helvetica-Bold',
    color: '#78716c',
    letterSpacing: 0.6,
  },
  recordId: { fontSize: FONT_META, color: '#a8a29e', marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: FONT.title,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
    color: '#181700',
    backgroundColor: '#f5f5f4',
    borderLeftWidth: 3,
    borderLeftColor: '#a8a29e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  identityTable: { borderWidth: 1, borderColor: '#e7e5e4' },
  identityRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  identityRowLast: { flexDirection: 'row' },
  identityCell: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: '#e7e5e4' },
  identityCellLast: { flex: 1, padding: 5 },
  identityLabel: { fontSize: FONT_META, color: '#78716c', marginBottom: 1, lineHeight: 1.4 },
  identityValue: { fontSize: FONT.body, fontFamily: 'Helvetica-Bold', lineHeight: FONT.lineHeight, color: '#181700' },
  bodyText: { fontSize: FONT.body, lineHeight: FONT.lineHeight, color: '#292524' },
  subLabel: { fontSize: FONT_SUB, fontFamily: 'Helvetica-Bold', color: '#57534e', marginBottom: 2, marginTop: 4 },
  chart: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 5, padding: 8, backgroundColor: '#fafaf9' },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  chartLabel: { width: 78, fontSize: FONT_SUB, color: '#57534e' },
  chartTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e7e5e4',
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  chartFill: { height: 8, borderRadius: 4 },
  chartValue: { width: 42, textAlign: 'right', fontSize: FONT_SUB, fontFamily: 'Helvetica-Bold', color: '#181700' },
  chartNote: { fontSize: FONT_META, color: '#78716c', marginTop: 4, lineHeight: 1.5 },
  table: { borderWidth: 1, borderColor: '#e7e5e4' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f4' },
  tableHeaderCell: {
    padding: 5,
    fontSize: FONT_TABLE,
    fontFamily: 'Helvetica-Bold',
    color: '#44403c',
    lineHeight: 1.35,
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e7e5e4' },
  tableCell: {
    padding: 5,
    fontSize: FONT_TABLE,
    lineHeight: FONT.lineHeight,
    color: '#292524',
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableCellLast: { padding: 5, fontSize: FONT_TABLE, lineHeight: FONT.lineHeight, color: '#292524' },
  pageFooterLine: {
    position: 'absolute',
    bottom: 34,
    left: 38,
    right: 38,
    height: 1,
    backgroundColor: '#e7e5e4',
  },
  pageFooterLeft: {
    position: 'absolute',
    bottom: 22,
    left: 38,
    fontSize: FONT_META,
    color: '#a8a29e',
  },
  pageFooterRight: {
    position: 'absolute',
    bottom: 22,
    right: 38,
    fontSize: FONT_META,
    color: '#a8a29e',
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 10,
    minHeight: 96,
  },
  footerInfo: { fontSize: FONT_META, color: '#a8a29e', maxWidth: 300, lineHeight: FONT.lineHeight },
  signatureBox: { width: 180, alignItems: 'center' },
  signatureLabel: { fontSize: FONT_TABLE, color: '#57534e', lineHeight: FONT.lineHeight },
  signatureSpace: { height: 42, justifyContent: 'center' },
  signaturePlaceholder: { fontSize: FONT_META, color: '#d6d3d1', fontStyle: 'italic' },
  signatureLine: { width: 120, borderTopWidth: 1, borderTopColor: '#d6d3d1', marginBottom: 4 },
  signatureName: { fontSize: FONT_SUB, fontFamily: 'Helvetica-Bold', color: '#181700', textAlign: 'center' },
  pengesahanHeader: { marginTop: 12, marginBottom: 16 },
  pengesahanTitle: { fontSize: FONT.title, fontFamily: 'Helvetica-Bold', color: '#181700', textAlign: 'center', lineHeight: FONT.lineHeight, marginBottom: 8 },
  pengesahanIntro: { fontSize: FONT.body, color: '#292524', lineHeight: FONT.lineHeight, marginBottom: 6 },
  pengesahanMeta: { fontSize: FONT.body, color: '#57534e', lineHeight: FONT.lineHeight },
  signaturePage: { flexGrow: 1, justifyContent: 'space-between' },
  signaturePageBody: { flexGrow: 1, paddingTop: 12 },
  signaturePageTitle: { fontSize: FONT.title, fontFamily: 'Helvetica-Bold', color: '#181700', lineHeight: FONT.lineHeight, marginBottom: 10, textAlign: 'center' },
  signaturePageMeta: { fontSize: FONT.body, color: '#57534e', lineHeight: FONT.lineHeight },
  signaturePageIntro: { fontSize: FONT.body, color: '#292524', lineHeight: FONT.lineHeight, marginBottom: 8 },
  attachmentSection: { marginTop: 4 },
  patientPhoto: { width: '100%', maxHeight: 260, objectFit: 'contain' },
  attachmentBlock: { marginBottom: 14 },
  attachmentImage: { width: '100%', maxHeight: 240, objectFit: 'contain', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 4, padding: 4, backgroundColor: '#fafaf9' },
  attachmentCaption: { fontSize: FONT_SUB, color: '#57534e', marginTop: 4, lineHeight: FONT.lineHeight },
  noteBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fafaf9',
  },
  noteTitle: { fontSize: FONT_SUB, fontFamily: 'Helvetica-Bold', color: '#57534e', lineHeight: FONT.lineHeight, marginBottom: 3 },
  noteText: { fontSize: FONT_SUB, color: '#78716c', lineHeight: FONT.lineHeight },
});

export type MedicalManagementRow = {
  date: string;
  therapy: string;
  evaluation: string;
  note: string;
};

export type MedicalRecordPdfTherapyInfo = {
  visitNumber?: number | null;
  status?: 'DRAFT' | 'FINALIZED' | null;
  patientVisible?: boolean;
  nextTherapyAt?: Date | string | null;
  frequencyText?: string | null;
  therapyGoal?: string | null;
  diagnosisLabel?: string | null;
};

export type MedicalRecordPdfTreatmentPlan = {
  goals: string;
  interventions: string;
  reviewIntervalText?: string | null;
  precautions?: string | null;
  status?: string | null;
};

export type MedicalRecordPdfHomeProgramItem = {
  name: string;
  instruction: string;
  sets?: number | null;
  repetitions?: number | null;
  durationSeconds?: number | null;
  frequencyText?: string | null;
  precaution?: string | null;
};

export type MedicalRecordPdfHomeProgram = {
  status?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  items: MedicalRecordPdfHomeProgramItem[];
};

export type MedicalRecordPdfData = {
  id: string;
  patientName: string;
  medicalRecordNumber?: string | null;
  gender?: string | null;
  patientDob?: Date | string | null;
  patientPhone?: string | null;
  patientAddress?: string | null;
  occupation?: string | null;
  patientPhotoUrl?: string | null;
  therapistName: string | null;
  recordedAt: Date;
  painScore: number;
  rangeOfMotionScore: number;
  strengthScore: number;
  functionScore: number;
  anamnesis: string | null;
  physicalExamination: string | null;
  medicalHistory: string | null;
  diagnosis: string | null;
  treatment: string | null;
  evaluation: string | null;
  followUpPlan: string | null;
  summary: string | null;
  managementRows?: MedicalManagementRow[];
  therapyInfo?: MedicalRecordPdfTherapyInfo | null;
  treatmentPlan?: MedicalRecordPdfTreatmentPlan | null;
  homeProgram?: MedicalRecordPdfHomeProgram | null;
  attachmentImages?: MedicalRecordPdfAttachmentImage[] | null;
};

export type MedicalRecordPdfAttachmentImage = {
  id: string;
  name: string;
  caption: string;
  dataUrl: string;
};

function calculateAge(dob: Date | string | null | undefined): string {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} tahun`;
}

function formatGender(gender: string | null | undefined): string {
  if (gender === 'MALE') return 'Laki-laki';
  if (gender === 'FEMALE') return 'Perempuan';
  if (gender === 'OTHER') return 'Lainnya';
  return gender || '-';
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
}

const scoreSummary = (record: MedicalRecordPdfData) =>
  `Nyeri ${record.painScore}/10 · ROM ${record.rangeOfMotionScore}/10 · Kekuatan ${record.strengthScore}/10 · Fungsi ${record.functionScore}/10`;

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function TextSection({ title, value }: { title: string; value: string | null | undefined }) {
  // Jarak antar paragraf mengikuti skala tipografi dokumen. Tanpa `wrap={false}`
  // agar teks sangat panjang mengalir ke halaman berikutnya, bukan terpotong.
  const paragraphs = (value ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.bodyText}>
        {paragraphs.length > 0 ? (
          <Text>{paragraphs.join('\n\n')}</Text>
        ) : (
          <Text>-</Text>
        )}
      </View>
    </View>
  );
}

const FUNCTIONAL_SCALE_NOTE =
  'Skala penilaian 0–10. Nyeri: angka lebih kecil berarti keluhan lebih ringan. ROM, kekuatan, dan fungsi: angka lebih besar berarti kemampuan lebih baik.';

/**
 * Grafik batang indikator fungsional agar pasien mudah membaca perkembangan.
 * Warna mengikuti arah skor: nyeri membaik saat turun, tiga indikator lain
 * membaik saat naik.
 */
function FunctionalChart({ record }: { record: MedicalRecordPdfData }) {
  const items = [
    { label: 'Nyeri (VAS)', value: record.painScore, inverse: true },
    { label: 'ROM', value: record.rangeOfMotionScore, inverse: false },
    { label: 'Kekuatan', value: record.strengthScore, inverse: false },
    { label: 'Fungsi', value: record.functionScore, inverse: false },
  ].map((item) => {
    const value = Math.max(0, Math.min(10, Number(item.value) || 0));
    const good = item.inverse ? value <= 3 : value >= 7;
    const mid = item.inverse ? value <= 6 : value >= 4;
    return {
      ...item,
      value,
      color: good ? '#4d7c0f' : mid ? '#b45309' : '#b91c1c',
      hint: good ? 'Baik' : mid ? 'Cukup' : 'Perlu perhatian',
    };
  });

  return (
    <View>
      <View style={styles.chart}>
        {items.map((item) => (
          <View key={item.label} style={styles.chartRow} wrap={false}>
            <Text style={styles.chartLabel}>{item.label}</Text>
            <View style={styles.chartTrack}>
              <View
                style={[styles.chartFill, { width: `${Math.max(4, item.value * 10)}%`, backgroundColor: item.color }]}
              />
            </View>
            <Text style={styles.chartValue}>
              {item.value}/10 · {item.hint}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.chartNote}>{FUNCTIONAL_SCALE_NOTE}</Text>
    </View>
  );
}

/** Footer tetap pada setiap halaman: identitas dokumen + nomor halaman. */
function PageFooter() {
  return (
    <>
      <View style={styles.pageFooterLine} fixed />
      <Text style={styles.pageFooterLeft} fixed>
        Hafta Fisioterapi · Rekam Medis Fisioterapi
      </Text>
      <Text
        style={styles.pageFooterRight}
        fixed
        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
      />
    </>
  );
}

function signatureBlock(record: MedicalRecordPdfData, printedAt: string) {
  return (
    <View style={styles.footer} wrap={false}>
      <View style={styles.footerInfo}>
        <Text>Dokumen ini dicetak dari sistem Hafta Fisioterapi dan hanya untuk keperluan pasien.</Text>
        <Text>Dicetak pada: {printedAt} WIB</Text>
        <Text>ID Dokumen: {record.id.slice(0, 8).toUpperCase()}</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Terapis Penanggung Jawab,</Text>
        <View style={styles.signatureSpace}>
          <Text style={styles.signaturePlaceholder}>[Tanda Tangan & Paraf]</Text>
        </View>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureName}>{record.therapistName || 'Terapis Hafta'}</Text>
      </View>
    </View>
  );
}

export const MedicalRecordDocument = ({
  record,
  signatureOnNewPage = false,
}: {
  record: MedicalRecordPdfData;
  /** Dipakai saat isi rekam lebih dari satu halaman. */
  signatureOnNewPage?: boolean;
}) => {
  const formattedDate = formatDate(record.recordedAt);
  const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  // @react-pdf/renderer hanya dapat menyematkan PNG/JPEG. Format lain (mis. WebP)
  // dirender sebagai kotak kosong, jadi disaring agar tidak muncul kotak hampa.
  const renderableAttachments = (record.attachmentImages ?? []).filter((attachment) =>
    /^data:image\/(png|jpe?g)[;,]/i.test(attachment.dataUrl),
  );
  const hasAttachments = renderableAttachments.length > 0;
  const logoUrl = `${origin}/images/logos/logos-text.png`;
  const visitLabel = record.therapyInfo?.visitNumber
    ? `Sesi ${record.therapyInfo.visitNumber}`
    : 'Evaluasi Terapi';
  const rows: MedicalManagementRow[] =
    record.managementRows && record.managementRows.length > 0
      ? record.managementRows
      : [
          {
            date: formattedDate,
            therapy: record.treatment || '-',
            evaluation: [record.evaluation, scoreSummary(record)].filter(Boolean).join('\n') || '-',
            note: record.followUpPlan || record.summary || '-',
          },
        ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          <View style={styles.header}>
            <View style={styles.headerIdentity}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={logoUrl} style={styles.headerLogo} />
              <View style={styles.headerClinic}>
                <Text style={styles.clinicName}>HAFTA FISIOTERAPI</Text>
                <Text style={styles.clinicInfo}>Klinik &amp; Layanan Terapi Fisik Profesional</Text>
                <Text style={styles.clinicInfo}>Jl. Pd. Sidokare Indah No.AE-13, Sidokare, Sidoarjo 61214</Text>
                <Text style={styles.clinicInfo}>WhatsApp: 0812-3293-2872</Text>
              </View>
            </View>
            <View style={styles.badgeBox}>
              <Text style={styles.badge}>REKAM MEDIS FISIOTERAPI</Text>
              <Text style={styles.recordId}>ID: {record.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.pengesahanHeader} wrap={false}>
            <Text style={styles.pengesahanTitle}>LEMBAR PENGESAHAN DOKUMEN</Text>
            <Text style={styles.pengesahanIntro}>
              Laporan ini merangkum hasil evaluasi fisioterapi pasien, meliputi identitas, informasi
              terapi, indikator fungsional, catatan SOAP, rencana terapi, program latihan,
              penatalaksanaan, dan lampiran hasil pemeriksaan bila tersedia.
            </Text>
            <Text style={styles.pengesahanMeta}>Jenis laporan: Rekam Medis Fisioterapi · {visitLabel}</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Catatan Pengesahan</Text>
              <Text style={styles.noteText}>
                Lembar ini adalah bagian tidak terpisahkan dari rekam medis dan memuat pengesahan
                terapis penanggung jawab. Koreksi setelah finalisasi dilakukan melalui mekanisme
                amandemen agar riwayat tetap tersimpan.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>1. IDENTITAS PASIEN</SectionTitle>
            <View style={styles.identityTable}>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>No. RM</Text>
                  <Text style={styles.identityValue}>{record.medicalRecordNumber || '-'}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Nama Pasien</Text>
                  <Text style={styles.identityValue}>{record.patientName}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Umur</Text>
                  <Text style={styles.identityValue}>{calculateAge(record.patientDob)}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Jenis Kelamin</Text>
                  <Text style={styles.identityValue}>{formatGender(record.gender)}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Alamat</Text>
                  <Text style={styles.identityValue}>{record.patientAddress || '-'}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Nomor HP</Text>
                  <Text style={styles.identityValue}>{record.patientPhone || '-'}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Pekerjaan</Text>
                  <Text style={styles.identityValue}>{record.occupation || '-'}</Text>
                </View>
              </View>
              <View style={styles.identityRowLast}>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Tanggal Pemeriksaan</Text>
                  <Text style={styles.identityValue}>{formattedDate}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>2. INFORMASI TERAPI</SectionTitle>
            <View style={styles.identityTable}>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Sesi</Text>
                  <Text style={styles.identityValue}>{visitLabel}</Text>
                </View>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Status Rekam</Text>
                  <Text style={styles.identityValue}>
                    {record.therapyInfo?.status === 'FINALIZED' ? 'Final' : 'Draf'}
                  </Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Terapis</Text>
                  <Text style={styles.identityValue}>{record.therapistName || 'Terapis Hafta'}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Jadwal Berikutnya</Text>
                  <Text style={styles.identityValue}>{formatDateTime(record.therapyInfo?.nextTherapyAt)}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Frekuensi Terapi</Text>
                  <Text style={styles.identityValue}>{record.therapyInfo?.frequencyText || '-'}</Text>
                </View>
              </View>
              <View style={styles.identityRowLast}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Tujuan Terapi</Text>
                  <Text style={styles.identityValue}>{record.therapyInfo?.therapyGoal || '-'}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Diagnosis Ringkas</Text>
                  <Text style={styles.identityValue}>{record.therapyInfo?.diagnosisLabel || record.diagnosis || '-'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>3. INDIKATOR FUNGSIONAL</SectionTitle>
            <FunctionalChart record={record} />
          </View>

          <TextSection title="4. ANAMNESA FISIOTERAPI" value={record.anamnesis} />
          <TextSection title="5. PEMERIKSAAN FISIK" value={record.physicalExamination} />
          <TextSection title="6. DIAGNOSIS FISIOTERAPI" value={record.diagnosis} />
          <TextSection title="7. RIWAYAT PENYAKIT" value={record.medicalHistory} />
          <TextSection title="8. TINDAKAN TERAPI" value={record.treatment} />
          <TextSection title="9. EVALUASI" value={record.evaluation} />
          <TextSection title="10. RENCANA TINDAK LANJUT" value={record.followUpPlan} />
          <TextSection title="11. RINGKASAN SESI" value={record.summary} />

          {record.treatmentPlan ? (
            <View style={styles.section}>
              <SectionTitle>12. RENCANA TERAPI</SectionTitle>
              <View style={styles.identityTable}>
                <View style={styles.identityRow}>
                  <View style={styles.identityCell}>
                    <Text style={styles.identityLabel}>Status</Text>
                    <Text style={styles.identityValue}>{record.treatmentPlan.status || '-'}</Text>
                  </View>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Interval Evaluasi</Text>
                    <Text style={styles.identityValue}>{record.treatmentPlan.reviewIntervalText || '-'}</Text>
                  </View>
                </View>
                <View style={styles.identityRow}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Tujuan</Text>
                    <Text style={styles.identityValue}>{record.treatmentPlan.goals || '-'}</Text>
                  </View>
                </View>
                <View style={styles.identityRow}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Intervensi</Text>
                    <Text style={styles.identityValue}>{record.treatmentPlan.interventions || '-'}</Text>
                  </View>
                </View>
                {record.treatmentPlan.precautions ? (
                  <View style={styles.identityRowLast}>
                    <View style={styles.identityCellLast}>
                      <Text style={styles.identityLabel}>Perhatian / Precaution</Text>
                      <Text style={styles.identityValue}>{record.treatmentPlan.precautions}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {record.homeProgram && record.homeProgram.items.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle>13. PROGRAM LATIHAN MANDIRI</SectionTitle>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Latihan</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Instruksi</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Dosis</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>Frekuensi</Text>
                </View>
                {record.homeProgram.items.map((item, index) => {
                  const dose = [
                    item.sets ? `${item.sets} set` : null,
                    item.repetitions ? `${item.repetitions} rep` : null,
                    item.durationSeconds ? `${item.durationSeconds} detik` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <View key={`${item.name}-${index}`} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.name}</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>{item.instruction || '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 0.8 }]}>{dose || '-'}</Text>
                      <Text style={[styles.tableCellLast, { flex: 1 }]}>{item.frequencyText || '-'}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle>14. PENATALAKSANAAN</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.9 }]}>Tanggal</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Terapi</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Evaluasi</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2, borderRightWidth: 0 }]}>Keterangan</Text>
              </View>
              {rows.map((row, index) => (
                <View key={`${row.date}-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.9 }]}>{row.date}</Text>
                  <Text style={[styles.tableCell, { flex: 1.6 }]}>{row.therapy}</Text>
                  <Text style={[styles.tableCell, { flex: 1.6 }]}>{row.evaluation}</Text>
                  <Text style={[styles.tableCellLast, { flex: 1.2 }]}>{row.note}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Catatan</Text>
            <Text style={styles.noteText}>
              Rekam medis ini merupakan ringkasan evaluasi fisioterapi. Perubahan setelah finalisasi
              dilakukan melalui amandemen dan tetap menyimpan riwayat. Hubungi klinik bila ada data
              yang perlu dikoreksi.
            </Text>
          </View>

          {record.patientPhotoUrl ? (
            <View style={styles.section}>
              <SectionTitle>FOTO KONDISI PASIEN</SectionTitle>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={record.patientPhotoUrl} style={styles.patientPhoto} />
            </View>
          ) : null}
        </View>

        {!signatureOnNewPage && !hasAttachments ? signatureBlock(record, printedAt) : null}

        <PageFooter />
      </Page>

      {hasAttachments ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.pageContent}>
            <View style={styles.attachmentSection}>
              <SectionTitle>15. LAMPIRAN FOTO ANALISA / HASIL PEMERIKSAAN</SectionTitle>
              {renderableAttachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentBlock} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={attachment.dataUrl} style={styles.attachmentImage} />
                  <Text style={styles.attachmentCaption}>{attachment.caption}</Text>
                </View>
              ))}
            </View>
          </View>

          {!signatureOnNewPage ? signatureBlock(record, printedAt) : null}

          <PageFooter />
        </Page>
      ) : null}

      {signatureOnNewPage ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.signaturePage}>
            <View style={styles.signaturePageBody}>
              <Text style={styles.signaturePageTitle}>PENGESAHAN TERAPIS</Text>
              <Text style={styles.signaturePageIntro}>
                Dengan ini dokumen rekam medis fisioterapi pasien telah diperiksa dan disahkan oleh
                terapis penanggung jawab. Lembar ini merupakan bagian tidak terpisahkan dari dokumen
                utama.
              </Text>
              <Text style={styles.signaturePageMeta}>Pasien: {record.patientName}</Text>
              <Text style={styles.signaturePageMeta}>No. RM: {record.medicalRecordNumber || '-'}</Text>
              <Text style={styles.signaturePageMeta}>Tanggal pemeriksaan: {formattedDate}</Text>
            </View>
            {signatureBlock(record, printedAt)}
          </View>

          <PageFooter />
        </Page>
      ) : null}
    </Document>
  );
};
