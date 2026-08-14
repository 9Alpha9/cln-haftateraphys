import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { patientIntakes, patients, users } from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * Fills the initial intake form (Form Awal) for every dummy patient.
 * Creates a SUBMITTED, version-1 intake per patient so entries appear in the
 * review list. De-identified dummy content only. Re-runs update in place
 * (idempotent). Remove before deploy with `pnpm db:seed:dummy:remove`.
 */
const DUMMY_EMAILS = [
  'patient1@dummy.hafta.test',
  'patient2@dummy.hafta.test',
  'patient3@dummy.hafta.test',
  'patient4@dummy.hafta.test',
  'patient5@dummy.hafta.test',
];

const dummyIntakes = [
  {
    email: 'patient1@dummy.hafta.test',
    chiefComplaint: 'Nyeri punggung bawah yang terasa tajam terutama saat berdiri lama atau bangkit dari duduk.',
    affectedArea: 'Punggung bawah (lumbal)',
    onsetDescription: 'Mulai terasa sekitar 3 bulan terakhir secara bertahap.',
    triggeringEvent: 'Mengangkat barang berat di tempat kerja dan duduk berlama di depan komputer.',
    aggravatingFactors: 'Duduk lama, membungkuk, dan mengangkat beban memperberat rasa nyeri.',
    relievingFactors: 'Berbaring, peregangan ringan, dan kompres hangat membantu meredakan.',
    dailyLimitations: 'Kesulitan bekerja berdiri lama, mengangkat barang, dan menaiki tangga.',
    previousInjuryHistory: 'Pernah terkilir punggung 5 tahun lalu saat olahraga.',
    surgeryHistory: 'Tidak ada riwayat operasi.',
    relevantMedicalHistory: 'Tidak ada penyakit kronis yang diketahui.',
    currentMedication: 'Paracetamol sesekali saat nyeri (tidak rutin).',
    allergies: 'Tidak ada alergi obat yang diketahui.',
    patientGoal: 'Ingin kembali bekerja tanpa nyeri dan mampu beraktivitas normal.',
  },
  {
    email: 'patient2@dummy.hafta.test',
    chiefComplaint: 'Nyeri leher dan bahu kanan yang terasa kaku, terutama di pagi hari.',
    affectedArea: 'Leher dan bahu kanan',
    onsetDescription: 'Kurang lebih 2 bulan terakhir, makin terasa dalam 1 bulan ini.',
    triggeringEvent: 'Posisi kepala menunduk lama saat menyetrika dan mengecek HP.',
    aggravatingFactors: 'Gerakan menoleh, menggendong anak, dan stres membuat nyeri bertambah.',
    relievingFactors: 'Kompres hangat dan memijat ringan membantu meredakan kaku.',
    dailyLimitations: 'Sulit tidur nyenyak dan mengangkat lengan ke atas.',
    previousInjuryHistory: 'Tidak ada cedera serius sebelumnya.',
    surgeryHistory: 'Operasi sesar 4 tahun lalu, sudah sembuh baik.',
    relevantMedicalHistory: 'Hipertensi ringan terkontrol dengan pola makan.',
    currentMedication: 'Tidak sedang minum obat rutin.',
    allergies: 'Alergi terhadap paracetamol (ruam ringan).',
    patientGoal: 'Leher dan bahu tidak kaku lagi, bisa tidur nyaman.',
  },
  {
    email: 'patient3@dummy.hafta.test',
    chiefComplaint: 'Nyeri lutut kanan saat berolahraga, terutama ketika berjongkok dan berlari.',
    affectedArea: 'Lutut kanan',
    onsetDescription: 'Muncul setelah intensitas latihan futsal bertambah, sejak 6 minggu lalu.',
    triggeringEvent: 'Lari interval dan banyak latihan melompat.',
    aggravatingFactors: 'Berlari, naik-turun tangga, dan duduk lama dengan lutut ditekuk.',
    relievingFactors: 'Istirahat dan kompres es setelah latihan membantu.',
    dailyLimitations: 'Kesulitan mengikuti jadwal futsal dan menaiki tangga kampus.',
    previousInjuryHistory: 'Pernah keseleo pergelangan kaki kiri 2 tahun lalu.',
    surgeryHistory: 'Tidak ada operasi.',
    relevantMedicalHistory: 'Tidak ada penyakit kronis.',
    currentMedication: 'Tidak minum obat rutin.',
    allergies: 'Tidak ada alergi obat.',
    patientGoal: 'Bisa kembali berlari dan bermain futsal tanpa nyeri.',
  },
  {
    email: 'patient4@dummy.hafta.test',
    chiefComplaint: 'Sakit kepala tegang dan nyeri tengkuk yang sering muncul saat jam kerja.',
    affectedArea: 'Kepala dan tengkuk',
    onsetDescription: 'Berulang dalam 2 bulan terakhir, sering pada sore hari.',
    triggeringEvent: 'Lama menatap layar komputer saat mengajar dan menyiapkan bahan ajar.',
    aggravatingFactors: 'Stres kerja dan kurang meregangkan tubuh.',
    relievingFactors: 'Istirahat sejenak dan stretching leher membantu.',
    dailyLimitations: 'Gangguan konsentrasi saat mengajar di kelas.',
    previousInjuryHistory: 'Tidak ada cedera fisik berarti.',
    surgeryHistory: 'Tidak ada operasi.',
    relevantMedicalHistory: 'Asma ringan datau tidak; tidak ada penyakit menahun signifikan.',
    currentMedication: 'Tidak rutin minum obat.',
    allergies: 'Tidak ada alergi obat yang diketahui.',
    patientGoal: 'Mengurangi frekuensi sakit kepala dan bisa bekerja nyaman.',
  },
  {
    email: 'patient5@dummy.hafta.test',
    chiefComplaint: 'Nyeri bahu kiri saat mengangkat lengan ke atas setelah beraktivitas berat.',
    affectedArea: 'Bahu kiri',
    onsetDescription: 'Terasa sejak 1 bulan lalu, memburuk setelah kerja berat.',
    triggeringEvent: 'Mengangkat/memindahkan barang dalam jumlah banyak.',
    aggravatingFactors: 'Gerakan mengangkat tangan melewati tinggi bahu.',
    relievingFactors: 'Istirahat dan kompres hangat membantu.',
    dailyLimitations: 'Rasa tidak nyaman saat berkendara dan menjangkau barang tinggi.',
    previousInjuryHistory: 'Pernah nyeri bahu kanan 3 tahun lalu, sembuh dengan terapi.',
    surgeryHistory: 'Tidak ada operasi.',
    relevantMedicalHistory: 'Diabetes tipe 2 terkontrol (diet).',
    currentMedication: 'Metformin sesuai resep dokter.',
    allergies: 'Tidak ada alergi obat.',
    patientGoal: 'Bahu bebas nyeri dan kemampuan gerak kembali penuh.',
  },
];

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed dummy intakes in production.');
  }

  const db = getDb();

  const all = await db
    .select({ id: patients.id, email: users.email })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id));

  const byEmail = new Map<string, string>();
  for (const row of all) {
    if (DUMMY_EMAILS.includes(row.email ?? '')) byEmail.set(row.email ?? '', row.id);
  }

  for (const d of dummyIntakes) {
    const patientId = byEmail.get(d.email);
    if (!patientId) {
      console.error(`SKIP ${d.email}: patient record not found.`);
      continue;
    }

    const [existing] = await db
      .select({ id: patientIntakes.id })
      .from(patientIntakes)
      .where(and(eq(patientIntakes.patientId, patientId), eq(patientIntakes.version, 1)))
      .limit(1);

    const values = {
      chiefComplaint: d.chiefComplaint,
      affectedArea: d.affectedArea,
      onsetDescription: d.onsetDescription,
      triggeringEvent: d.triggeringEvent,
      aggravatingFactors: d.aggravatingFactors,
      relievingFactors: d.relievingFactors,
      dailyLimitations: d.dailyLimitations,
      previousInjuryHistory: d.previousInjuryHistory,
      surgeryHistory: d.surgeryHistory,
      relevantMedicalHistory: d.relevantMedicalHistory,
      currentMedication: d.currentMedication,
      allergies: d.allergies,
      patientGoal: d.patientGoal,
      dataAccuracyAcknowledged: 1,
      status: 'SUBMITTED' as const,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(patientIntakes)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(patientIntakes.id, existing.id), eq(patientIntakes.patientId, patientId)));
      console.log(`OK   intake updated for ${d.email}`);
    } else {
      await db.insert(patientIntakes).values({
        patientId,
        version: 1,
        ...values,
      });
      console.log(`OK   intake created for ${d.email}`);
    }
  }

  console.log('Seeding dummy intakes completed.');
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
