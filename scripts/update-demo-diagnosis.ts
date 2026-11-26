import { eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { therapyProgressRecords } from '@/db/schema';

/**
 * One-off: rapikan narasi rekam medis demo (pengganti lorem ipsum) dengan
 * teks klinis dummy berbahasa Indonesia (de-identified). Semua rekam dalam
 * satu hari kunjungan mendapat narasi yang sama agar base + amandemen
 * konsisten. Tidak ada data pasien nyata.
 */
const NARRATIVES = [
  {
    diagnosis:
      'Assessment awal: osteoarthritis lutut kanan derajat 1, disertai nyeri leher postural akibat posisi kerja di depan layar.',
    anamnesis:
      'Pasien mengeluh nyeri lutut kanan saat naik tangga dan berjalan jauh. Nyeri leher bagian belakang terasa setelah seharian bekerja di depan layar.',
    physicalExamination:
      'Krepitasi ringan pada lutut kanan saat fleksi-ekstensi. Ketegangan otot leher bagian belakang dengan postur kepala agak maju ke depan.',
    treatment:
      'Terapi latihan penguatan kuadrisep lutut kanan, kinesio taping, peregangan aktif leher, dan edukasi postur kerja.',
    evaluation: 'Nyeri lutut berkurang setelah latihan terpimpin. Mobilitas leher membaik dengan peregangan rutin.',
    followUpPlan: 'Lanjutkan latihan penguatan 2 kali seminggu dan sesuaikan tinggi layar kerja.',
    summary: 'Sesi evaluasi awal: kondisi lutut kanan dan leher dapat dikelola dengan terapi latihan terstruktur.',
  },
  {
    diagnosis:
      'Sindrom nyeri lumbal mekanik dengan kelemahan otot core; disertai nyeri bahu kiri saat mengangkat lengan.',
    anamnesis:
      'Nyeri punggung bawah sejak dua minggu, menjalar ke bokong dan bertambah saat duduk lama. Nyeri bahu kiri muncul saat mengangkat beban; sisa nyeri lutut kanan hanya sesekali.',
    physicalExamination:
      'ROM lumbal terbatas pada gerak fleksi dengan nyeri tekan otot paraspinal. Kekuatan rotator bahu kiri grade 4; ketegangan otot leher dengan postur kepala maju.',
    treatment:
      'Manual therapy lumbal, latihan core stability, TENS 15 menit, terapi latihan penguatan rotator bahu kiri, dan edukasi postur.',
    evaluation: 'Nyeri punggung bawah menurun setelah core stability; kontrol bahu kiri meningkat.',
    followUpPlan: 'Latihan core 10 menit per hari di rumah dan hindari angkat beban di atas kepala minggu ini.',
    summary: 'Perkembangan baik: nyeri berkurang dan kekuatan area bahu serta punggung meningkat.',
  },
];

async function run() {
  const db = getDb();

  const rows = await db
    .select({ id: therapyProgressRecords.id, recordedAt: therapyProgressRecords.recordedAt })
    .from(therapyProgressRecords)
    .where(
      or(
        eq(therapyProgressRecords.diagnosis, NARRATIVES[0].diagnosis),
        eq(therapyProgressRecords.diagnosis, NARRATIVES[1].diagnosis),
      ),
    );

  if (rows.length === 0) {
    console.log('Tidak ada rekam demo yang cocok; tidak ada yang diubah.');
    return;
  }

  // Hari kunjungan unik, urut lama → baru.
  const dayKeys = Array.from(
    new Set(rows.map((row) => new Date(row.recordedAt).toDateString())),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  for (let dayIndex = 0; dayIndex < dayKeys.length; dayIndex++) {
    const narrative = NARRATIVES[Math.min(dayIndex, NARRATIVES.length - 1)];
    const dayRows = rows.filter((row) => new Date(row.recordedAt).toDateString() === dayKeys[dayIndex]);
    for (const row of dayRows) {
      await db
        .update(therapyProgressRecords)
        .set({ ...narrative, updatedAt: new Date() })
        .where(eq(therapyProgressRecords.id, row.id));
    }
    console.log(`Kunjungan ${dayIndex + 1}: ${dayRows.length} rekam diperbarui.`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
