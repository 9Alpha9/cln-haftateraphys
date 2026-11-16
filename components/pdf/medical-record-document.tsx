import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 34,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9.5,
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
  headerLogo: { width: 100, height: 40, objectFit: 'contain', marginLeft: -16, marginRight: 8, marginTop: -4, alignSelf: 'flex-start' },
  headerClinic: { flex: 1 },
  clinicName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#181700', marginBottom: 2 },
  clinicInfo: { fontSize: 7.5, color: '#57534e', marginTop: 1 },
  badgeBox: { alignItems: 'flex-end', marginLeft: 6 },
  badge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#181700',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a8a29e',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  recordId: { fontSize: 7.5, color: '#a8a29e', marginTop: 4 },
  section: { marginBottom: 11 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#181700',
    backgroundColor: '#f5f5f4',
    borderLeftWidth: 3,
    borderLeftColor: '#a8a29e',
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginBottom: 6,
  },
  identityTable: { borderWidth: 1, borderColor: '#e7e5e4' },
  identityRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  identityRowLast: { flexDirection: 'row' },
  identityCell: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: '#e7e5e4' },
  identityCellLast: { flex: 1, padding: 5 },
  identityLabel: { fontSize: 7, color: '#78716c', marginBottom: 2 },
  identityValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#181700' },
  bodyText: { fontSize: 9.2, lineHeight: 1.5, color: '#292524' },
  subLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#57534e', marginBottom: 2, marginTop: 4 },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  scoreBox: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 5,
    padding: 6,
    backgroundColor: '#fafaf9',
  },
  scoreLabel: { fontSize: 7.5, color: '#78716c' },
  scoreValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#181700', marginTop: 2 },
  table: { borderWidth: 1, borderColor: '#e7e5e4' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f4' },
  tableHeaderCell: {
    padding: 4.5,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#44403c',
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e7e5e4' },
  tableCell: {
    padding: 4.5,
    fontSize: 7.6,
    lineHeight: 1.4,
    color: '#292524',
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableCellLast: { padding: 4.5, fontSize: 7.6, lineHeight: 1.4, color: '#292524' },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 8,
    minHeight: 84,
  },
  footerInfo: { fontSize: 7, color: '#a8a29e', maxWidth: 280, lineHeight: 1.5 },
  signatureBox: { width: 150, alignItems: 'center' },
  signatureLabel: { fontSize: 8, color: '#57534e' },
  signatureSpace: { height: 34, justifyContent: 'center' },
  signaturePlaceholder: { fontSize: 7.5, color: '#d6d3d1', fontStyle: 'italic' },
  signatureLine: { width: 100, borderTopWidth: 1, borderTopColor: '#d6d3d1', marginBottom: 3 },
  signatureName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#181700', textAlign: 'center' },
  signaturePage: { flexGrow: 1, justifyContent: 'space-between' },
  signaturePageBody: { flexGrow: 1, paddingTop: 12 },
  signaturePageTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#181700', marginBottom: 10, textAlign: 'center' },
  signaturePageMeta: { fontSize: 8.5, color: '#57534e', marginBottom: 2 },
  signaturePageIntro: { fontSize: 8.5, color: '#292524', lineHeight: 1.5, marginBottom: 5 },
  attachmentSection: { marginTop: 4 },
  attachmentBlock: { marginBottom: 10 },
  attachmentImage: { width: '100%', maxHeight: 230, objectFit: 'contain', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 4, padding: 4, backgroundColor: '#fafaf9' },
  attachmentCaption: { fontSize: 7.5, color: '#57534e', marginTop: 3, lineHeight: 1.4 },
  noteBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 5,
    padding: 8,
    backgroundColor: '#fafaf9',
  },
  noteTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#57534e', marginBottom: 2 },
  noteText: { fontSize: 7.5, color: '#78716c', lineHeight: 1.45 },
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
  return (
    <View style={styles.section} wrap={false}>
      <SectionTitle>{title}</SectionTitle>
      <Text style={styles.bodyText}>{value?.trim() || '-'}</Text>
    </View>
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
            <View style={styles.scoreRow}>
              {[
                { label: 'Nyeri (VAS)', value: record.painScore },
                { label: 'ROM', value: record.rangeOfMotionScore },
                { label: 'Kekuatan', value: record.strengthScore },
                { label: 'Fungsi', value: record.functionScore },
              ].map((item) => (
                <View key={item.label} style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>{item.label}</Text>
                  <Text style={styles.scoreValue}>{item.value}/10</Text>
                </View>
              ))}
            </View>
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
                    <View key={`${item.name}-${index}`} style={styles.tableRow} wrap={false}>
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
                <View key={`${row.date}-${index}`} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.tableCell, { flex: 0.9 }]}>{row.date}</Text>
                  <Text style={[styles.tableCell, { flex: 1.6 }]}>{row.therapy}</Text>
                  <Text style={[styles.tableCell, { flex: 1.6 }]}>{row.evaluation}</Text>
                  <Text style={[styles.tableCellLast, { flex: 1.2 }]}>{row.note}</Text>
                </View>
              ))}
            </View>
          </View>

          {record.attachmentImages && record.attachmentImages.length > 0 ? (
            <View break style={styles.attachmentSection}>
              <SectionTitle>15. LAMPIRAN FOTO ANALISA / HASIL PEMERIKSAAN</SectionTitle>
              {record.attachmentImages.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentBlock} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={attachment.dataUrl} style={styles.attachmentImage} />
                  <Text style={styles.attachmentCaption}>{attachment.caption}</Text>
                </View>
              ))}
            </View>
          ) : null}

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
              <Image src={record.patientPhotoUrl} style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }} />
            </View>
          ) : null}
        </View>

        {!signatureOnNewPage ? signatureBlock(record, printedAt) : null}
      </Page>

      {signatureOnNewPage ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.signaturePage}>
            <View style={styles.signaturePageBody}>
              <Text style={styles.signaturePageTitle}>LEMBAR PENGESAHAN DOKUMEN</Text>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={styles.signaturePageIntro}>
                  Laporan ini merangkum hasil evaluasi fisioterapi pasien, meliputi identitas,
                  informasi terapi, indikator fungsional, catatan SOAP, rencana terapi, program
                  latihan, penatalaksanaan, dan lampiran hasil pemeriksaan bila tersedia.
                </Text>
                <Text style={styles.signaturePageMeta}>Jenis laporan: Rekam Medis Fisioterapi · {visitLabel}</Text>
                <Text style={styles.signaturePageMeta}>Pasien: {record.patientName}</Text>
                <Text style={styles.signaturePageMeta}>No. RM: {record.medicalRecordNumber || '-'}</Text>
                <Text style={styles.signaturePageMeta}>Tanggal pemeriksaan: {formattedDate}</Text>
                <Text style={styles.signaturePageMeta}>Terapis: {record.therapistName || 'Terapis Hafta'}</Text>
              </View>
              <View style={[styles.identityTable, { marginTop: 10 }]}>
                <View style={styles.identityRow}>
                  <View style={styles.identityCell}>
                    <Text style={styles.identityLabel}>Status Rekam</Text>
                    <Text style={styles.identityValue}>
                      {record.therapyInfo?.status === 'FINALIZED' ? 'Final' : 'Draf'}
                    </Text>
                  </View>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Jumlah Lampiran</Text>
                    <Text style={styles.identityValue}>{record.attachmentImages?.length ?? 0} gambar</Text>
                  </View>
                </View>
                <View style={styles.identityRow}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Diagnosis</Text>
                    <Text style={styles.identityValue}>{record.diagnosis || '-'}</Text>
                  </View>
                </View>
                <View style={styles.identityRow}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Tindakan Utama</Text>
                    <Text style={styles.identityValue}>{record.treatment || '-'}</Text>
                  </View>
                </View>
                <View style={styles.identityRowLast}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Indikator Fungsional</Text>
                    <Text style={styles.identityValue}>{scoreSummary(record)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Catatan Pengesahan</Text>
                <Text style={styles.noteText}>
                  Lembar ini adalah bagian tidak terpisahkan dari rekam medis dan memuat pengesahan
                  terapis penanggung jawab. Koreksi setelah finalisasi dilakukan melalui mekanisme
                  amandemen agar riwayat tetap tersimpan.
                </Text>
              </View>
            </View>
            {signatureBlock(record, printedAt)}
          </View>
        </Page>
      ) : null}
    </Document>
  );
};
