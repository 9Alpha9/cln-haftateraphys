import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { IntakeHistoryPdfData } from '@/server/queries/patient-intakes';

const s = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    paddingBottom: 95,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'cover',
    marginRight: 10,
  },
  clinicBlock: {},
  clinicName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  clinicDetail: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  recordId: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 4,
  },

  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 20,
  },

  patientBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 24,
  },
  patientBoxTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  patientCol: {
    width: '50%',
  },
  fieldLabel: {
    fontSize: 8,
    color: '#94a3b8',
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 12,
    marginTop: 4,
  },

  fieldGroup: {
    marginBottom: 14,
  },
  fieldGroupLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  fieldGroupValue: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.5,
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
    fontSize: 8,
    color: '#94a3b8',
  },
  signatureBox: {
    width: 145,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  signatureSpace: {
    height: 40,
    justifyContent: 'center',
  },
  signaturePlaceholder: {
    fontSize: 8,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  signatureLine: {
    width: 100,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
});

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Terkirim',
  UNDER_REVIEW: 'Sedang Ditinjau',
  NEEDS_REVISION: 'Perlu Perbaikan',
  ACCEPTED: 'Diterima',
  ARCHIVED: 'Diarsipkan',
};

function formatDate(d: Date | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function FieldSection({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldGroupLabel}>{label}</Text>
      <Text style={s.fieldGroupValue}>{value}</Text>
    </View>
  );
}

export function IntakeHistoryDocument({ data }: { data: IntakeHistoryPdfData }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const logoUrl = `${origin}/images/logos/logos-text.png`;
  const genderLabel = data.gender === 'MALE' ? 'Laki-laki' : data.gender === 'FEMALE' ? 'Perempuan' : '-';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <Image src={logoUrl} style={s.logo} />
            <View style={s.clinicBlock}>
              <Text style={s.clinicName}>HAFTA FISIOTERAPI</Text>
              <Text style={s.clinicDetail}>Klinik & Layanan Terapi Fisik Profesional</Text>
              <Text style={s.clinicDetail}>Jl. Operasional Klinik No. 8, Indonesia</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.badge}>FORM AWAL</Text>
            <Text style={s.recordId}>ID: {data.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        <Text style={s.title}>Riwayat Form Awal Pemeriksaan</Text>
        <Text style={s.subtitle}>
          {statusLabel[data.status] || data.status} {' '}&bull;{' '}
          {formatDate(data.submittedAt)}
        </Text>

        <View style={s.patientBox}>
          <Text style={s.patientBoxTitle}>Data Pasien</Text>
          <View style={s.patientRow}>
            <View style={s.patientCol}>
              <Text style={s.fieldLabel}>Nama Lengkap</Text>
              <Text style={s.fieldValue}>{data.patientName}</Text>
            </View>
            <View style={s.patientCol}>
              <Text style={s.fieldLabel}>No. Rekam Medis</Text>
              <Text style={s.fieldValue}>{data.medicalRecordNumber || '-'}</Text>
            </View>
          </View>
          <View style={s.patientRow}>
            <View style={s.patientCol}>
              <Text style={s.fieldLabel}>Tanggal Lahir</Text>
              <Text style={s.fieldValue}>{formatDate(data.dateOfBirth)}</Text>
            </View>
            <View style={s.patientCol}>
              <Text style={s.fieldLabel}>Jenis Kelamin</Text>
              <Text style={s.fieldValue}>{genderLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Keluhan & Riwayat Penyakit</Text>
        <FieldSection label="Keluhan Utama" value={data.chiefComplaint} />
        <FieldSection label="Area Tubuh yang Terdampak" value={data.affectedArea} />
        <FieldSection label="Onset / Mulai Gejala" value={data.onsetDescription} />
        <FieldSection label="Pemicu / Triggering Event" value={data.triggeringEvent} />
        <FieldSection label="Faktor yang Memperberat" value={data.aggravatingFactors} />
        <FieldSection label="Faktor yang Meredakan" value={data.relievingFactors} />
        <FieldSection label="Keterbatasan Aktivitas Sehari-hari" value={data.dailyLimitations} />

        <Text style={s.sectionTitle}>Riwayat Medis & Kebiasaan</Text>
        <FieldSection label="Riwayat Cedera Sebelumnya" value={data.previousInjuryHistory} />
        <FieldSection label="Riwayat Operasi / Bedah" value={data.surgeryHistory} />
        <FieldSection label="Riwayat Medis Relevan Lainnya" value={data.relevantMedicalHistory} />
        <FieldSection label="Obat yang Sedang Dikonsumsi" value={data.currentMedication} />
        <FieldSection label="Riwayat Alergi" value={data.allergies} />

        <Text style={s.sectionTitle}>Tujuan Terapi</Text>
        <FieldSection label="Yang Diharapkan dari Terapi" value={data.patientGoal} />

        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerInfo}>Dokumen ini merupakan bagian dari rekam medis Klinik Hafta Fisioterapi.</Text>
            <Text style={s.footerInfo}>Dicetak pada: {new Date().toLocaleString('id-ID')}</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Pasien / Perwakilan,</Text>
            <View style={s.signatureSpace}>
              <Text style={s.signaturePlaceholder}>[Tanda Tangan]</Text>
            </View>
            <View style={s.signatureLine} />
            <Text style={s.signatureName}>{data.patientName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
