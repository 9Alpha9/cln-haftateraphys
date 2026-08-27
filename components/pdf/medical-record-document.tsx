import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createTw } from '@hyperline/react-pdf-tailwind';

const tw = createTw({
  theme: {
    fontFamily: {
      sans: ['Helvetica'],
    },
  },
});

const styles = StyleSheet.create({
  page: {
    ...tw('p-10 bg-white'),
    paddingBottom: 95,
  },
  header: tw('mb-7 border-b border-slate-200 pb-4 flex flex-row justify-between items-center'),
  headerIdentity: tw('flex flex-row items-center'),
  headerLogo: {
    width: 105,
    height: 42,
    objectFit: 'cover',
    marginRight: 10,
  },
  headerClinic: {
    width: 285,
  },
  clinicInfo: tw('text-[9px] text-slate-900 font-semibold mt-0.5'),
  clinicInfoAccent: tw('text-[12px] text-slate-900 font-bold mb-0.5'),
  badge: tw('text-[9px] font-bold text-slate-700 bg-slate-100 px-2 py-1 border border-slate-200'),
  recordId: tw('text-[9px] text-slate-400 mt-1'),

  infoBox: tw('mb-8'),
  infoRow: tw('flex flex-row mb-4'),
  infoCol: tw('w-1/2'),
  infoLabel: tw('text-[10px] text-slate-400 mb-1'),
  infoValue: tw('text-xs font-bold text-slate-900'),

  sectionTitle: tw('text-xs font-bold text-slate-800 mb-4'),
  metricsGrid: tw('flex flex-row gap-4 mb-8'),
  metricCard: tw('w-1/4 items-center py-2'),
  metricLabel: tw('text-[10px] text-slate-500 font-bold'),
  metricValue: tw('text-[18px] font-bold text-slate-900 mt-1'),
  metricTotal: tw('text-[10px] text-slate-400'),

  notesSection: tw('mb-8'),
  noteItem: tw('mb-6'),
  noteTitle: tw('text-[11px] font-bold text-slate-700 mb-1'),
  noteContent: tw('text-[11px] leading-[18px] text-slate-800'),

  footer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerInfo: tw('text-[9px] text-slate-400'),
  signatureBox: {
    width: 155,
    alignItems: 'center',
  },
  signatureLabel: tw('text-[9px] text-slate-500'),
  signatureSpace: tw('h-11 justify-center'),
  signaturePlaceholder: tw('text-[9px] text-slate-300 italic'),
  signatureLine: {
    width: 105,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginBottom: 4,
  },
  signatureName: tw('text-[10px] font-bold text-slate-900 text-center'),
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
          <View style={tw('items-end')}>
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
