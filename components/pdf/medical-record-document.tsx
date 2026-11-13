import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 90,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1c1917',
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerIdentity: { flexDirection: 'row', alignItems: 'flex-start' },
  headerLogo: { width: 120, height: 56, objectFit: 'contain', marginRight: 12, alignSelf: 'flex-start' },
  headerClinic: { width: 280 },
  clinicName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#181700', marginBottom: 2 },
  clinicInfo: { fontSize: 8, color: '#57534e', marginTop: 1 },
  badgeBox: { alignItems: 'flex-end' },
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#181700',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a8a29e',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recordId: { fontSize: 8, color: '#a8a29e', marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#181700',
    backgroundColor: '#f5f5f4',
    borderLeftWidth: 3,
    borderLeftColor: '#a8a29e',
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginBottom: 7,
  },
  identityTable: { borderWidth: 1, borderColor: '#e7e5e4' },
  identityRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  identityRowLast: { flexDirection: 'row' },
  identityCell: { flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: '#e7e5e4' },
  identityCellLast: { flex: 1, padding: 6 },
  identityLabel: { fontSize: 7.5, color: '#78716c', marginBottom: 2 },
  identityValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#181700' },
  bodyText: { fontSize: 9.5, lineHeight: 1.55, color: '#292524' },
  subLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#57534e', marginBottom: 2, marginTop: 4 },
  table: { borderWidth: 1, borderColor: '#e7e5e4' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f4' },
  tableHeaderCell: {
    padding: 5,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#44403c',
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e7e5e4' },
  tableCell: {
    padding: 5,
    fontSize: 8,
    lineHeight: 1.45,
    color: '#292524',
    borderRightWidth: 1,
    borderRightColor: '#e7e5e4',
  },
  tableCellLast: { padding: 5, fontSize: 8, lineHeight: 1.45, color: '#292524' },
  footer: {
    position: 'absolute',
    left: 36,
    right: 36,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 8,
  },
  footerInfo: { fontSize: 7.5, color: '#a8a29e' },
  signatureBox: { width: 150, alignItems: 'center' },
  signatureLabel: { fontSize: 8, color: '#57534e' },
  signatureSpace: { height: 36, justifyContent: 'center' },
  signaturePlaceholder: { fontSize: 8, color: '#d6d3d1', fontStyle: 'italic' },
  signatureLine: { width: 100, borderTopWidth: 1, borderTopColor: '#d6d3d1', marginBottom: 3 },
  signatureName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#181700', textAlign: 'center' },
  patientPhotoSection: {
    marginBottom: 12,
    alignItems: 'center',
    justify: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 6,
    backgroundColor: '#fafaf9',
  },
  patientPhoto: {
    maxHeight: 280,
    width: '100%',
    objectFit: 'contain',
    borderRadius: 4,
  },
  patientPhotoCaption: {
    marginTop: 6,
    fontSize: 8,
    color: '#78716c',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

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

export type MedicalManagementRow = {
  date: string;
  therapy: string;
  evaluation: string;
  note: string;
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
};

const scoreSummary = (record: MedicalRecordPdfData) =>
  `Nyeri ${record.painScore}/10 · ROM ${record.rangeOfMotionScore}/10 · Kekuatan ${record.strengthScore}/10 · Fungsi ${record.functionScore}/10`;

export const MedicalRecordDocument = ({ record }: { record: MedicalRecordPdfData }) => {
  const formattedDate = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const logoUrl = `${origin}/images/logos/logos-text.png`;
  const rows: MedicalManagementRow[] =
    record.managementRows && record.managementRows.length > 0
      ? record.managementRows
      : [
          {
            date: formattedDate,
            therapy: record.treatment || '-',
            evaluation:
              [record.evaluation, scoreSummary(record)].filter(Boolean).join('\n') || '-',
            note: record.followUpPlan || record.summary || '-',
          },
        ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoUrl} style={styles.headerLogo} />
            <View style={styles.headerClinic}>
              <Text style={styles.clinicName}>HAFTA FISIOTERAPI</Text>
              <Text style={styles.clinicInfo}>Klinik & Layanan Terapi Fisik Profesional</Text>
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
          <Text style={styles.sectionTitle}>IDENTITAS PASIEN</Text>
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
                <Text style={styles.identityLabel}>Terapis</Text>
                <Text style={styles.identityValue}>{record.therapistName || 'Terapis Hafta'}</Text>
              </View>
            </View>
            <View style={styles.identityRow}>
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

        {record.patientPhotoUrl ? (
          <View style={styles.patientPhotoSection}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={record.patientPhotoUrl} style={styles.patientPhoto} />
            <Text style={styles.patientPhotoCaption}>
              Foto kondisi pasien - area keluhan yang dikirimkan melalui formulir intake pasien.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ANAMNESA FISIOTERAPI</Text>
          <Text style={styles.bodyText}>{record.anamnesis || '-'}</Text>
          {record.physicalExamination ? (
            <>
              <Text style={styles.subLabel}>Pemeriksaan Fisik</Text>
              <Text style={styles.bodyText}>{record.physicalExamination}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. DIAGNOSA</Text>
          <Text style={styles.bodyText}>{record.diagnosis || '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. RIWAYAT PENYAKIT</Text>
          <Text style={styles.bodyText}>{record.medicalHistory || '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. CATATAN KLINIS</Text>
          <Text style={styles.bodyText}>{record.summary || '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. PENATALAKSANAAN</Text>
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

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerInfo}>Dokumen ini disahkan secara digital oleh Klinik Hafta Fisioterapi.</Text>
            <Text style={styles.footerInfo}>Dicetak pada: {new Date().toLocaleString('id-ID')}</Text>
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
      </Page>
    </Document>
  );
};
