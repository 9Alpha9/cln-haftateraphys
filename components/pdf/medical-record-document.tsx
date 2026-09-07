import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    paddingBottom: 95,
  },
  header: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 105,
    height: 42,
    objectFit: 'cover',
    marginRight: 10,
  },
  headerClinic: {
    width: 285,
  },
  clinicInfo: {
    fontSize: 9,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  clinicInfoAccent: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordId: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },

  infoBox: {
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoCol: {
    width: '50%',
  },
  infoLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 4,
  },
  metricTotal: {
    fontSize: 10,
    color: '#94a3b8',
  },

  notesSection: {
    marginBottom: 32,
  },
  noteItem: {
    marginBottom: 24,
  },
  noteTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 4,
  },
  noteContent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1e293b',
  },

  footer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerInfo: {
    fontSize: 9,
    color: '#94a3b8',
  },
  signatureBox: {
    width: 155,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  signatureSpace: {
    height: 44,
    justifyContent: 'center',
  },
  signaturePlaceholder: {
    fontSize: 9,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  signatureLine: {
    width: 105,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
});

export type MedicalRecordPdfData = {
  id: string;
  patientName: string;
  therapistName: string | null;
  recordedAt: Date;
  painScore: number;
  rangeOfMotionScore: number;
  strengthScore: number;
  functionScore: number;
  anamnesis: string | null;
  physicalExamination: string | null;
  diagnosis: string | null;
  treatment: string | null;
  followUpPlan: string | null;
  summary: string | null;
};

export const MedicalRecordDocument = ({ record }: { record: MedicalRecordPdfData }) => {
  const formattedDate = new Date(record.recordedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const logoUrl = `${origin}/images/logos/logos-text.png`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <Image src={logoUrl} style={styles.headerLogo} />
            <View style={styles.headerClinic}>
              <Text style={styles.clinicInfo}>Klinik & Layanan Terapi Fisik Profesional</Text>
              <Text style={styles.clinicInfo}>Jl. Operasional Klinik No. 8, Indonesia</Text>
              <Text style={styles.clinicInfo}>Telp: (021) 555-0199</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>REKAM MEDIS RESMI</Text>
            <Text style={styles.recordId}>ID: {record.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nama Pasien</Text>
              <Text style={styles.infoValue}>{record.patientName}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Terapis Penanggung Jawab</Text>
              <Text style={styles.infoValue}>{record.therapistName || 'Terapis Hafta'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Tanggal Pelayanan</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Status Dokumen</Text>
              <Text style={styles.infoValue}>Finalized</Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Ringkasan Parameter Fisik</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Nyeri</Text>
              <Text style={styles.metricValue}>{record.painScore} <Text style={styles.metricTotal}>/10</Text></Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ROM</Text>
              <Text style={styles.metricValue}>{record.rangeOfMotionScore} <Text style={styles.metricTotal}>/10</Text></Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Kekuatan</Text>
              <Text style={styles.metricValue}>{record.strengthScore} <Text style={styles.metricTotal}>/10</Text></Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Fungsi</Text>
              <Text style={styles.metricValue}>{record.functionScore} <Text style={styles.metricTotal}>/10</Text></Text>
            </View>
          </View>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Catatan & Diagnosa Klinis</Text>

          {record.anamnesis && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>ANAMNESIS (KELUHAN UTAMA & RIWAYAT)</Text>
              <Text style={styles.noteContent}>{record.anamnesis}</Text>
            </View>
          )}

          {record.physicalExamination && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>PEMERIKSAAN FISIK & PENUNJANG</Text>
              <Text style={styles.noteContent}>{record.physicalExamination}</Text>
            </View>
          )}

          {record.diagnosis && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>DIAGNOSIS FISIOTERAPI</Text>
              <Text style={styles.noteContent}>{record.diagnosis}</Text>
            </View>
          )}

          {record.treatment && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>PENGOBATAN & TINDAKAN DIBERIKAN</Text>
              <Text style={styles.noteContent}>{record.treatment}</Text>
            </View>
          )}

          {record.followUpPlan && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>RENCANA TINDAK LANJUT & EDUKASI</Text>
              <Text style={styles.noteContent}>{record.followUpPlan}</Text>
            </View>
          )}

          {record.summary && (
            <View style={styles.noteItem}>
              <Text style={styles.noteTitle}>RINGKASAN TAMBAHAN</Text>
              <Text style={styles.noteContent}>{record.summary}</Text>
            </View>
          )}
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
