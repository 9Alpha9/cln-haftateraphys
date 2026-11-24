import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * Skala tipografi dokumen (pt). Identik dengan medical-record-document
 * untuk menjaga konsistensi visual lintas dokumen klinis.
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
    paddingBottom: 88,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: FONT.body,
    lineHeight: FONT.lineHeight,
    color: '#1c1917',
    orphans: 2,
    widows: 2,
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
  bodyText: { fontSize: FONT.body, lineHeight: FONT.lineHeight, color: '#292524', orphans: 2, widows: 2 },
  subLabel: { fontSize: FONT_SUB, fontFamily: 'Helvetica-Bold', color: '#57534e', marginBottom: 2, marginTop: 4 },
  chart: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 6, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: '#fafaf9' },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chartLabel: { width: 78, fontSize: FONT_SUB, color: '#57534e' },
  chartTrack: {
    flex: 1,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e7e5e4',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartFill: { height: 7, borderRadius: 3.5 },
  chartValue: { width: 68, textAlign: 'right', fontSize: FONT_META, fontFamily: 'Helvetica-Bold', color: '#181700' },
  chartScaleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  chartScaleSpacer: { width: 86 },
  chartScale: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginRight: 8 },
  chartScaleText: { fontSize: FONT_META, color: '#a8a29e' },
  chartNote: { fontSize: FONT_META, color: '#78716c', marginTop: 6, lineHeight: 1.5 },
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
  pageFooter: {
    position: 'absolute',
    top: 793,
    left: 38,
    right: 38,
    textAlign: 'center',
    fontSize: FONT_SUB,
    color: '#57534e',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 6,
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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

function formatDate(value: Date | string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatGender(gender: string | null | undefined): string {
  if (gender === 'MALE') return 'Laki-laki';
  if (gender === 'FEMALE') return 'Perempuan';
  if (gender === 'OTHER') return 'Lainnya';
  return gender || '-';
}

function formatTime(time: string): string {
  return `${time} WIB`;
}

export type AppointmentPdfData = {
  id: string;
  patientName: string;
  medicalRecordNumber?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  addressCity?: string | null;
  therapistName?: string | null;
  scheduledDate: Date | string;
  startTime: string;
  durationMinutes: number;
  status: string;
  administrativeNote?: string | null;
};

function SectionTitle({ children }: { children: string }) {
  return (
    <View minPresenceAhead={86}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <Text
      style={styles.pageFooter}
      fixed
      render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
    />
  );
}

function footerBlock(printedAt: string, documentId: string) {
  return (
    <View style={styles.footer} wrap={false}>
      <View style={styles.footerInfo}>
        <Text>Dokumen ini dicetak dari sistem Hafta Fisioterapi dan hanya untuk keperluan pasien.</Text>
        <Text>Dicetak pada: {printedAt} WIB</Text>
        <Text>ID Dokumen: {documentId.slice(0, 8).toUpperCase()}</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Fisioterapis,</Text>
        <View style={styles.signatureSpace}>
          <Text style={styles.signaturePlaceholder}>[Tanda Tangan & Paraf]</Text>
        </View>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureName}>Hafta Fisioterapi</Text>
      </View>
    </View>
  );
}

function statusBadge(status: string) {
  const statusLabel: Record<string, string> = {
    SCHEDULED: 'Terjadwal',
    CONFIRMED: 'Terkonfirmasi',
    IN_PROGRESS: 'Sedang berjalan',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    NO_SHOW: 'Tidak hadir',
  };
  return statusLabel[status] ?? status;
}

export const AppointmentDocument = ({
  record,
  logoUrl,
}: {
  record: AppointmentPdfData;
  logoUrl?: string;
}) => {
  const date = new Date(record.scheduledDate);
  const formattedDate = formatDate(date);
  const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const resolvedLogoUrl = logoUrl ?? `${origin}/images/logos/logos-text-pdf.png`;
  const patientAddress = [record.addressLine, record.addressCity].filter(Boolean).join(', ') || '-';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageFooter />
        <View style={styles.pageContent}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerIdentity}>
              <Image src={resolvedLogoUrl} style={styles.headerLogo} />
              <View style={styles.headerClinic}>
                <Text style={styles.clinicName}>HAFTA FISIOTERAPI</Text>
                <Text style={styles.clinicInfo}>
                  Klinik & Layanan Terapi Fisik Profesional
                </Text>
                <Text style={styles.clinicInfo}>
                  Jl. Pd. Sidokare Indah No.AE-13, Sidokare, Sidoarjo 61214
                  {'\n'}
                  WhatsApp: 0812-3293-2872
                </Text>
              </View>
            </View>
            <View style={styles.badgeBox}>
              <Text style={styles.badge}>JADWAL APPOINTMENT</Text>
              <Text style={styles.recordId}>ID: {record.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* ── Judul ── */}
          <View style={{ marginTop: 20, alignItems: 'center', textAlign: 'center' }}>
            <Text style={{ fontSize: FONT.title + 2, fontFamily: 'Helvetica-Bold', color: '#181700', marginBottom: 4 }}>
              Bukti Jadwal Kunjungan
            </Text>
            <Text style={{ fontSize: FONT_META, color: '#57534e', lineHeight: FONT.lineHeight, maxWidth: '80%' }}>
              Dokumen ini merupakan bukti jadwal kunjungan pasien di Hafta Fisioterapi.
            </Text>
          </View>

          {/* ── Ringkasan Jadwal ── */}
          <View style={styles.section}>
            <SectionTitle>Ringkasan Jadwal</SectionTitle>
            <View style={styles.identityTable}>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Tanggal</Text>
                  <Text style={styles.identityValue}>{formattedDate}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Waktu</Text>
                  <Text style={styles.identityValue}>{formatTime(record.startTime)} · {record.durationMinutes} menit</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Data Pasien ── */}
          <View style={styles.section}>
            <SectionTitle>Data Pasien</SectionTitle>
            <View style={styles.identityTable}>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Nama Pasien</Text>
                  <Text style={styles.identityValue}>{record.patientName}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>No. Rekam Medis</Text>
                  <Text style={styles.identityValue}>{record.medicalRecordNumber || '-'}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Umur / Tanggal Lahir</Text>
                  <Text style={styles.identityValue}>
                    {record.dateOfBirth
                      ? (() => {
                          const dob = new Date(record.dateOfBirth);
                          if (isNaN(dob.getTime())) return '-';
                          const today = new Date();
                          let age = today.getFullYear() - dob.getFullYear();
                          const m = today.getMonth() - dob.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                          return `${age} tahun (${dob.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`;
                        })()
                      : '-'}
                  </Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Jenis Kelamin</Text>
                  <Text style={styles.identityValue}>{formatGender(record.gender)}</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Nomor Telepon</Text>
                  <Text style={styles.identityValue}>{record.phone || '-'}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Alamat Domisili</Text>
                  <Text style={styles.identityValue}>{patientAddress}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Detail Jadwal ── */}
          <View style={styles.section}>
            <SectionTitle>Detail Jadwal Kunjungan</SectionTitle>
            <View style={styles.identityTable}>
              <View style={styles.identityRow}>
                <View style={styles.identityCell}>
                  <Text style={styles.identityLabel}>Fisioterapis</Text>
                  <Text style={styles.identityValue}>{record.therapistName ?? 'Belum ditentukan'}</Text>
                </View>
                <View style={styles.identityCellLast}>
                  <Text style={styles.identityLabel}>Status</Text>
                  <Text style={styles.identityValue}>{statusBadge(record.status)}</Text>
                </View>
              </View>
              {record.administrativeNote ? (
                <View style={styles.identityRowLast}>
                  <View style={styles.identityCellLast}>
                    <Text style={styles.identityLabel}>Catatan Petugas</Text>
                    <Text style={styles.identityValue}>{record.administrativeNote}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Catatan Penting ── */}
          <View style={styles.section}>
            <SectionTitle>Catatan Penting</SectionTitle>
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Perhatian:</Text>
              <Text style={styles.noteText}>&bull; Harap hadir 10 menit sebelum waktu yang dijadwalkan.</Text>
              <Text style={styles.noteText}>&bull; Bawa kartu identitas dan kartu asuransi (jika ada).</Text>
              <Text style={styles.noteText}>&bull; Hubungi klinik jika perlu mengubah atau membatalkan jadwal.</Text>
            </View>
          </View>

          {/* ── Footer / Pengesahan ── */}
          {footerBlock(printedAt, record.id)}
        </View>
      </Page>
    </Document>
  );
};