import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  users,
  profiles,
  patients,
  patientIntakes,
  patientAssignments,
  appointments,
  appointmentRequests,
  therapyProgressRecords,
  homePrograms,
  homeProgramItems,
  notifications,
} from '@/db/schema';

/**
 * Script untuk mengisi dan memperbarui data akun "terapis@test.com"
 * agar menjadi simulasi data pasien sungguhan yang kredibel, konsisten,
 * dan sesuai standar klinis fisioterapi Hafta Fisioterapi.
 */
async function run() {
  const db = getDb();

  console.log('--- Memulai pengisian data pasien sungguhan untuk terapis@test.com ---');

  // 1. Dapatkan user terapis@test.com
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'terapis@test.com'))
    .limit(1);

  if (!targetUser) {
    throw new Error('User terapis@test.com tidak ditemukan di database.');
  }

  const userId = targetUser.id;
  console.log(`User ID: ${userId} (${targetUser.email})`);

  // Dapatkan profil terapis penanggung jawab (Hafta Terapis 1)
  const [therapistUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'haftaterapis1@gmail.com'))
    .limit(1);

  const therapistId = therapistUser?.id || userId;
  console.log(`Therapist ID: ${therapistId}`);

  // 2. Perbarui data Profile
  await db
    .update(profiles)
    .set({
      displayName: 'Terapis',
      phone: '0812-3456-7890',
      accountType: 'USER',
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId));
  console.log('✓ Profile diperbarui');

  // 3. Dapatkan atau buat Patient record
  let [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);

  const nextTherapyDate = new Date();
  nextTherapyDate.setDate(nextTherapyDate.getDate() + 3);
  nextTherapyDate.setHours(10, 0, 0, 0);

  const patientData = {
    fullName: 'Terapis',
    gender: 'MALE' as const,
    medicalRecordNumber: patient?.medicalRecordNumber || 'MR-2026-0812',
    dateOfBirth: new Date('1996-06-15'),
    occupation: 'Software Engineer',
    addressLine: 'Jl. Raya Ponti No. 24, Perumahan Pondok Sidokare Asri',
    addressProvince: 'JAWA TIMUR',
    addressCity: 'KABUPATEN SIDOARJO',
    emergencyContactName: 'Ratna Dewi',
    emergencyContactRelationship: 'Istri',
    emergencyContactPhone: '0813-9876-5432',
    caseStatus: 'ACTIVE' as const,
    therapyGoal:
      'Menghilangkan nyeri pinggang bawah dan leher kaku, memperbaiki postur kerja di depan komputer, serta mampu duduk bekerja 2-3 jam tanpa keluhan nyeri.',
    therapyDiagnosisLabel:
      'Mechanical Low Back Pain (Lumbar Postural Strain) & Cervical Syndrome',
    therapyFrequencyText: '2x Seminggu',
    nextTherapyAt: nextTherapyDate,
    therapistNote:
      'Pasien menunjukkan perbaikan fungsional yang signifikan. Nyeri berkurang dari skala 7 ke 2-3. Ketahanan otot core membaik. Pasien diinstruksikan menjaga posisi monitor sejajar mata dan rutin melakukan home exercise mandiri.',
    therapistNoteAuthor: 'Hafta Terapis 1',
    therapistNoteAt: new Date('2026-10-25T10:30:00.000Z'),
    updatedAt: new Date(),
  };

  if (!patient) {
    const [inserted] = await db
      .insert(patients)
      .values({
        userId,
        ...patientData,
      })
      .returning();
    patient = inserted;
    console.log('✓ Patient baru dibuat');
  } else {
    await db
      .update(patients)
      .set(patientData)
      .where(eq(patients.id, patient.id));
    console.log('✓ Patient data diperbarui');
  }

  const patientId = patient.id;

  // 4. Pastikan Primary Therapist Assignment ada
  const [existingAssignment] = await db
    .select()
    .from(patientAssignments)
    .where(eq(patientAssignments.patientId, patientId))
    .limit(1);

  if (!existingAssignment) {
    await db.insert(patientAssignments).values({
      patientId,
      staffUserId: therapistId,
      assignmentType: 'PRIMARY_THERAPIST',
      createdBy: therapistId,
    });
    console.log('✓ Assignment therapist dibuat');
  } else {
    await db
      .update(patientAssignments)
      .set({
        staffUserId: therapistId,
        assignmentType: 'PRIMARY_THERAPIST',
      })
      .where(eq(patientAssignments.id, existingAssignment.id));
    console.log('✓ Assignment therapist diperbarui');
  }

  // 5. Perbarui Patient Intakes (Form Awal)
  // Bersihkan nilai sembarangan pada intake versi 1 dan 2
  const existingIntakes = await db
    .select()
    .from(patientIntakes)
    .where(eq(patientIntakes.patientId, patientId));

  const realisticIntakeV2 = {
    chiefComplaint:
      'Nyeri tumpul pada pinggang bagian bawah yang terasa menjalar ke area bokong atas setelah duduk lama, disertai rasa pegal tegang di tengkuk leher dan pundak kanan.',
    affectedArea: 'Punggung bawah (regio lumbosacral L4-S1) dan leher kanan (cervical posterior)',
    onsetDescription:
      'Keluhan pertama kali dirasakan 4 bulan lalu, semakin memberat dalam 3 minggu terakhir seiring bertambahnya jam kerja lembur di depan laptop.',
    triggeringEvent:
      'Duduk bekerja di depan layar komputer selama 8-10 jam per hari tanpa kursi ergonomis dan minim jeda istirahat peregangan.',
    aggravatingFactors:
      'Duduk statis lebih dari 45 menit, membungkuk saat mengambil barang di lantai, dan berkendara saat macet.',
    relievingFactors:
      'Berbaring telentang dengan kedua tungkai disangga bantal, kompres hangat di punggung bawah, dan jalan santai ringan.',
    dailyLimitations:
      'Sulit duduk fokus bekerja lebih dari 1 jam, kesulitan membungkuk saat memakai kaos kaki, dan leher kaku saat menoleh ke kanan.',
    previousInjuryHistory:
      'Pernah mengalami spasme otot punggung bawah sekitar 2 tahun lalu saat mengangkat koper, pulih dengan istirahat.',
    surgeryHistory: 'Tidak pernah menjalani operasi apapun.',
    relevantMedicalHistory:
      'Tidak ada riwayat diabetes atau hipertensi. Tidak ada keluhan baal/kebas menjalar ke jari kaki, BAK dan BAB normal.',
    currentMedication: 'Paracetamol 500 mg diminum hanya bila nyeri sangat mengganggu (tidak rutin).',
    allergies: 'Tidak ada riwayat alergi obat maupun makanan.',
    patientGoal:
      'Nyeri pinggang dan kaku leher sembuh tuntas, postur kerja ergonomis, dan dapat berolahraga lari akhir pekan tanpa cemas pinggang kumat.',
    dataAccuracyAcknowledged: 1,
    status: 'ACCEPTED' as const,
    reviewMessage:
      'Form Awal telah diverifikasi dan disetujui. Indikasi mechanical low back pain dan postural strain. Program fisioterapi difokuskan pada manual therapy, modalitas pereda nyeri, peregangan aktif, dan penguatan core stability.',
    reviewedBy: therapistId,
    reviewedAt: new Date('2026-10-23T12:30:00.000Z'),
    submittedAt: new Date('2026-10-23T12:00:00.000Z'),
    updatedAt: new Date(),
  };

  const realisticIntakeV1 = {
    chiefComplaint:
      'Nyeri pinggang bawah awal yang muncul setelah lembur kerja di depan komputer.',
    affectedArea: 'Punggung bawah',
    onsetDescription: 'Sekitar 4 bulan lalu secara perlahan.',
    triggeringEvent: 'Duduk berjam-jam saat menyelesaikan proyek.',
    aggravatingFactors: 'Duduk membungkuk lama.',
    relievingFactors: 'Rebahan dan istirahat.',
    dailyLimitations: 'Pegal saat duduk di kantor.',
    previousInjuryHistory: 'Pernah terkilir ringan 2 tahun lalu.',
    surgeryHistory: 'Tidak ada riwayat operasi.',
    relevantMedicalHistory: 'Tidak ada penyakit kronis.',
    currentMedication: 'Paracetamol bila perlu.',
    allergies: 'Tidak ada alergi.',
    patientGoal: 'Mengurangi rasa pegal pada pinggang.',
    dataAccuracyAcknowledged: 1,
    status: 'ARCHIVED' as const,
    reviewMessage: 'Intake awal diterima untuk asesmen dan evaluasi awal klinis.',
    reviewedBy: therapistId,
    reviewedAt: new Date('2026-09-07T16:30:00.000Z'),
    submittedAt: new Date('2026-09-07T06:27:00.000Z'),
    updatedAt: new Date(),
  };

  if (existingIntakes.length === 0) {
    await db.insert(patientIntakes).values({
      patientId,
      version: 1,
      ...realisticIntakeV2,
    });
    console.log('✓ Intake baru dibuat');
  } else {
    for (const item of existingIntakes) {
      if (item.version === 1) {
        await db
          .update(patientIntakes)
          .set(realisticIntakeV1)
          .where(eq(patientIntakes.id, item.id));
      } else if (item.version === 2) {
        await db
          .update(patientIntakes)
          .set(realisticIntakeV2)
          .where(eq(patientIntakes.id, item.id));
      }
    }
    console.log('✓ Intake records diperbarui ke data klinis realistis');
  }

  // 6. Perbarui dan Isi Rekam Perkembangan Terapi (Therapy Progress / SOAP)
  const existingRecords = await db
    .select()
    .from(therapyProgressRecords)
    .where(eq(therapyProgressRecords.patientId, patientId));

  const progressDataList = [
    {
      recordedAt: new Date('2026-09-07T09:30:00.000Z'),
      painScore: 7,
      rangeOfMotionScore: 4,
      strengthScore: 5,
      functionScore: 4,
      anamnesis:
        'Pasien mengeluhkan nyeri pinggang bawah skala 7/10 yang memburuk setelah duduk coding 8 jam. Pinggang terasa kaku di pagi hari dan sulit membungkuk saat memakai sepatu.',
      physicalExamination:
        'Inspeksi: postur flat back dengan protraksi bahu. Palpasi: spasme berat dan tender point m. erector spinae L3-L5 dextra & m. quadratus lumborum. ROM fleksi lumbal terbatas (finger-to-floor 25 cm). Tes Schober positif ringan. SLR negatif bilateral (tidak ada radikulopati). MMT otot core transversus abdominis 3/5.',
      diagnosis:
        'Mechanical Low Back Pain e.c. Postural Strain & Myofascial Trigger Point regio Lumbalis.',
      treatment:
        'Intervensi: Hot pack lumbal 15 menit, TENS konvensional frekuensi 100 Hz selama 15 menit, myofascial release erector spinae & gluteal, edukasi gentle pelvic tilt di tempat tidur.',
      followUpPlan:
        'Jadwalkan terapi 2x per minggu. Hindari mengangkat beban >5 kg dan atur alarm istirahat peregangan tiap 45 menit saat bekerja.',
      summary:
        'Sesi 1 (Asesmen Awal): Nyeri berkurang dari skala 7 ke 5 pasca modalitas & manual terapi. Pasien memahami instruksi dasar posisi istirahat.',
      status: 'FINALIZED' as const,
      patientVisible: 1,
      finalizedAt: new Date('2026-09-07T10:30:00.000Z'),
      finalizedBy: therapistId,
      therapistId,
    },
    {
      recordedAt: new Date('2026-09-21T15:00:00.000Z'),
      painScore: 5,
      rangeOfMotionScore: 6,
      strengthScore: 6,
      functionScore: 6,
      anamnesis:
        'Pasien melaporkan nyeri pinggang bawah mulai berkurang dibanding minggu lalu. Namun leher dan pundak kanan terasa tegang karena deadline pekerjaan lembur.',
      physicalExamination:
        'Spasme lumbal berkurang dari sesi sebelumnya. Trigger point terdeteksi di m. trapezius upper dextra dan m. levator scapulae. Fleksi lumbal membaik (finger-to-floor 15 cm). Rotasi leher kanan terbatas di akhir lingkup gerak.',
      diagnosis:
        'Resolusi parsial Lumbar Sprain; disertai Upper Cross Syndrome ringan akibat postur menunduk lama.',
      treatment:
        'Ultrasound therapy pada m. trapezius upper dextra (1 MHz, 1.2 W/cm², 7 menit), friction massage lembut, gentle stretching hamstring & piriformis, koreksi chin tuck.',
      followUpPlan:
        'Lanjutkan program latihan leher mandiri di kantor dan pertahankan hidrasi yang cukup.',
      summary:
        'Sesi 2: Nyeri lumbal stabil menurun (VAS 5). Keluhan kaku leher teratasi sebagian pasca terapi US dan stretching.',
      status: 'FINALIZED' as const,
      patientVisible: 1,
      finalizedAt: new Date('2026-09-21T16:00:00.000Z'),
      finalizedBy: therapistId,
      therapistId,
    },
    {
      recordedAt: new Date('2026-10-15T10:00:00.000Z'),
      painScore: 4,
      rangeOfMotionScore: 7,
      strengthScore: 7,
      functionScore: 7,
      anamnesis:
        'Pasien merasa jauh lebih nyaman saat duduk bekerja. Nyeri pinggang hanya timbul jika duduk lebih dari 2 jam tanpa jeda. Leher sudah tidak kaku lagi.',
      physicalExamination:
        'Palpasi m. erector spinae lunak, trigger point minimal. ROM lumbal fleksi penuh tanpa hambatan nyeri tajam. MMT core stability meningkat menjadi 4/5 (mampu menahan plank lutut 20 detik).',
      diagnosis:
        'Fase rehabilitasi penguatan; mechanical low back pain dalam fase resolusi aktif progresif.',
      treatment:
        'TENS conditioning, latihan stabilisasi lumbal: Cat-Camel, Bird-Dog progression, bridging exercise 3 set x 10 repetisi. Edukasi aktivasi otot core saat duduk bekerja.',
      followUpPlan:
        'Tingkatkan durasi latihan penguatan mandiri di rumah. Evaluasi fungsi duduk kerja pada sesi berikutnya.',
      summary:
        'Sesi 3: Mobilitas tulang belakang normal kembali, kekuatan otot penopang punggung meningkat memuaskan.',
      status: 'FINALIZED' as const,
      patientVisible: 1,
      finalizedAt: new Date('2026-10-15T11:00:00.000Z'),
      finalizedBy: therapistId,
      therapistId,
    },
    {
      recordedAt: new Date('2026-10-23T09:30:00.000Z'),
      painScore: 3,
      rangeOfMotionScore: 8,
      strengthScore: 8,
      functionScore: 8,
      anamnesis:
        'Pasien sudah mampu bekerja normal 8 jam dengan jeda peregangan tiap 1 jam tanpa perlu minum obat pereda nyeri. Merasa postur tubuh lebih tegap.',
      physicalExamination:
        'ROM trunk penuh di semua bidang (fleksi, ekstensi, rotasi kanan-kiri). Tes provokasi nyeri lumbal negatif. Ketahanan core meningkat (plank 45 detik).',
      diagnosis:
        'Mechanical Low Back Pain terkontrol sangat baik; kesiapan transisi ke program pemeliharaan mandiri.',
      treatment:
        'Peregangan dinamis rantai posterior (hamstring, gluteus, piriformis), latihan resistensi core menggunakan theraband, evaluasi teknik ergonomi kerja.',
      followUpPlan:
        'Jadwalkan sesi evaluasi dan monitoring lanjutan. Teruskan latihan mandiri.',
      summary:
        'Sesi 4: Nyeri turun ke skala 3/10. Pasien mandiri dan patuh dalam melakukan home program exercise.',
      status: 'FINALIZED' as const,
      patientVisible: 1,
      finalizedAt: new Date('2026-10-23T10:30:00.000Z'),
      finalizedBy: therapistId,
      therapistId,
    },
    {
      recordedAt: new Date('2026-10-26T10:00:00.000Z'),
      painScore: 2,
      rangeOfMotionScore: 9,
      strengthScore: 9,
      functionScore: 9,
      anamnesis:
        'Pasien mencoba jogging ringan 2 km selama akhir pekan tanpa keluhan nyeri pinggang. Nyeri leher sudah nihil dan tidak kambuh.',
      physicalExamination:
        'Postur lumbal lordosis fisiologis terjaga baik. Fleksibilitas dan kekuatan otot ekstremitas bawah simetris kanan-kiri. Indeks disabilitas fungsional minimal.',
      diagnosis:
        'Postural Strain & Low Back Pain mendekati resolusi total (near-complete recovery).',
      treatment:
        'Postural re-education akhir, latihan fungsional integratif (bodyweight squat dengan aktivasi core, deadbug exercise), pemutakhiran lembar Home Program.',
      followUpPlan:
        'Pertahankan home program 3x seminggu. Jadwalkan kontrol berkala 1 bulan mendatang atau bila ada keluhan kambuh.',
      summary:
        'Sesi 5: Pasien mencapai 90% target fungsional terapi. Nyeri minimal (VAS 2 saat lelah). Lanjut program pencegahan mandiri.',
      status: 'FINALIZED' as const,
      patientVisible: 1,
      finalizedAt: new Date('2026-10-26T11:00:00.000Z'),
      finalizedBy: therapistId,
      therapistId,
    },
  ];

  // Update record yang ada atau masukkan jika kurang
  for (let i = 0; i < progressDataList.length; i++) {
    const data = progressDataList[i];
    if (existingRecords[i]) {
      await db
        .update(therapyProgressRecords)
        .set(data)
        .where(eq(therapyProgressRecords.id, existingRecords[i].id));
    } else {
      await db.insert(therapyProgressRecords).values({
        patientId,
        ...data,
      });
    }
  }
  console.log(`✓ ${progressDataList.length} Therapy Progress SOAP records diperbarui`);

  // 7. Perbarui Appointments & Appointment Requests
  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId));

  // Pastikan appointment terhubung ke data yang rapi dan konsisten
  for (const appt of existingAppointments) {
    if (appt.startTime === '09:30' || appt.scheduledDate.startsWith('2026-10-23')) {
      await db
        .update(appointments)
        .set({
          type: 'FOLLOW_UP',
          status: 'COMPLETED',
          administrativeNote: 'Sesi terapi lanjutan ke-4, fokus peregangan dan penguatan core stability.',
          completionNote:
            'Sesi berjalan lancar. Pasien menyelesaikan seluruh rangkaian latihan core stability dan edukasi ergonomi.',
          completedAt: new Date('2026-10-23T10:30:00.000Z'),
          completedBy: therapistId,
          therapistId,
        })
        .where(eq(appointments.id, appt.id));
    } else if (appt.scheduledDate.startsWith('2026-10-24')) {
      await db
        .update(appointments)
        .set({
          type: 'FOLLOW_UP',
          status: 'COMPLETED',
          administrativeNote: 'Sesi monitoring perkembangan fungsional dan konsultasi latihan mandiri.',
          completionNote:
            'Pasien hadir tepat waktu. Evaluasi mobilitas lumbal dan leher menunjukkan perbaikan berkelanjutan.',
          completedAt: new Date('2026-10-24T11:00:00.000Z'),
          completedBy: therapistId,
          therapistId,
        })
        .where(eq(appointments.id, appt.id));
    } else if (appt.startTime === '10:00' && appt.scheduledDate.startsWith('2026-10-26')) {
      await db
        .update(appointments)
        .set({
          type: 'THERAPY_SESSION',
          status: 'COMPLETED',
          administrativeNote:
            'Jadwal disetujui. Sesi evaluasi klinis dan latihan integratif fungsional.',
          completionNote:
            'Sesi evaluasi akhir berjalan sangat baik. Pasien mampu melakukan deadbug dan bird-dog tanpa kompensasi pinggang.',
          completedAt: new Date('2026-10-26T11:00:00.000Z'),
          completedBy: therapistId,
          therapistId,
        })
        .where(eq(appointments.id, appt.id));
    } else if (appt.startTime === '13:30' && appt.scheduledDate.startsWith('2026-10-26')) {
      // Ubah appointment duplikat hari ini menjadi appointment tindak lanjut mendatang yang rapi
      const upcomingDateStr = `${nextTherapyDate.toISOString().slice(0, 10)} 00:00:00`;
      await db
        .update(appointments)
        .set({
          scheduledDate: upcomingDateStr,
          startTime: '10:00',
          type: 'FOLLOW_UP',
          status: 'SCHEDULED',
          administrativeNote:
            'Sesi kontrol berkala dan penyesuaian intensitas latihan mandiri. Mohon hadir 10 menit sebelum waktu terapi.',
          completionNote: null,
          completedAt: null,
          completedBy: null,
          therapistId,
        })
        .where(eq(appointments.id, appt.id));
    }
  }
  console.log('✓ Appointments diperbarui dengan catatan klinis dan jadwal mendatang');

  // Perbarui Appointment Request
  const [existingReq] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.patientId, patientId))
    .limit(1);

  if (existingReq) {
    await db
      .update(appointmentRequests)
      .set({
        patientNote:
          'Mohon jadwal sesi terapi lanjutan untuk evaluasi perkembangan nyeri pinggang dan leher.',
        reviewNote:
          'Jadwal disetujui oleh fisioterapis. Mohon datang 10 menit sebelum terapi dimulai untuk persiapan.',
        reviewedBy: therapistId,
      })
      .where(eq(appointmentRequests.id, existingReq.id));
    console.log('✓ Appointment Request diperbarui');
  }

  // 8. Buat Home Program (Latihan Mandiri di Rumah)
  let [program] = await db
    .select()
    .from(homePrograms)
    .where(eq(homePrograms.patientId, patientId))
    .limit(1);

  if (!program) {
    const startsAt = new Date('2026-10-23T00:00:00.000Z');
    const endsAt = new Date('2026-11-23T00:00:00.000Z');

    const [insertedProg] = await db
      .insert(homePrograms)
      .values({
        patientId,
        status: 'ACTIVE',
        startsAt,
        endsAt,
        patientVisible: 1,
        createdBy: therapistId,
      })
      .returning();
    program = insertedProg;

    const programItems = [
      {
        homeProgramId: program.id,
        name: 'Cat-Camel Stretch (Regang Kucing-Unta)',
        instruction:
          'Posisikan tubuh merangkak di atas matras. Tarik napas perlahan sambil melengkungkan punggung ke bawah (camel), lalu hembuskan napas sambil melengkungkan punggung ke atas (cat). Lakukan dengan lembut tanpa hentakan.',
        sets: 2,
        repetitions: 10,
        frequencyText: '1-2x sehari (pagi dan sore)',
        precaution: 'Hentikan bila terasa nyeri menusuk tajam pada pinggang.',
        sortOrder: 1,
        status: 'ACTIVE' as const,
      },
      {
        homeProgramId: program.id,
        name: 'Bird-Dog Exercise (Stabilisasi Punggung & Core)',
        instruction:
          'Dari posisi merangkak, luruskan lengan kanan ke depan dan tungkai kiri ke belakang secara bersamaan hingga sejajar lantai. Tahan 3-5 detik, kembali ke posisi awal dan ganti sisi sebaliknya.',
        sets: 3,
        repetitions: 8,
        frequencyText: '1x sehari saat jeda istirahat kerja',
        precaution: 'Jaga panggul tetap datar dan jangan biarkan perut melorot ke bawah.',
        sortOrder: 2,
        status: 'ACTIVE' as const,
      },
      {
        homeProgramId: program.id,
        name: 'Pelvic Tilt (Aktivasi Otot Perut Bawah)',
        instruction:
          'Berbaring telentang dengan kedua lutut ditekuk dan telapak kaki menapak lantai. Ratakan punggung bawah ke matras dengan mengencangkan otot perut bawah secara lembut, tahan 5 detik lalu rileks.',
        sets: 2,
        repetitions: 12,
        frequencyText: 'Setiap malam sebelum tidur',
        precaution: 'Bernapaslah secara normal dan teratur, jangan menahan napas.',
        sortOrder: 3,
        status: 'ACTIVE' as const,
      },
      {
        homeProgramId: program.id,
        name: 'Chin Tuck & Upper Trapezius Stretch (Koreksi Postur Leher)',
        instruction:
          'Duduk tegak, tarik dagu perlahan ke arah belakang seperti membuat double chin (tahan 5 detik). Lanjutkan dengan memiringkan kepala ke arah telinga kiri secara lembut dengan bantuan tangan kiri untuk meregangkan pundak kanan (tahan 20 detik).',
        sets: 3,
        repetitions: 5,
        frequencyText: 'Tiap 2 jam saat bekerja di meja laptop',
        precaution: 'Lakukan tarikan dengan sangat lembut, jangan memaksakan gerakan.',
        sortOrder: 4,
        status: 'ACTIVE' as const,
      },
    ];

    await db.insert(homeProgramItems).values(programItems);
    console.log('✓ Home Program & 4 item latihan mandiri berhasil dibuat');
  } else {
    console.log('✓ Home Program sudah ada');
  }

  // 9. Bersihkan dan rapikan Notifikasi
  // Buat notifikasi baru yang relevan jika belum ada
  const recentNotifs = [
    {
      userId,
      title: 'Form Awal Diterima & Disetujui',
      message:
        'Fisioterapis telah meninjau keluhan Anda dan menyetujui formulir awal untuk program terapi terpadu.',
      actionUrl: '/dashboard/intake',
      isRead: true,
      createdAt: new Date('2026-10-23T12:30:00.000Z'),
    },
    {
      userId,
      title: 'Program Latihan Mandiri Baru',
      message:
        'Fisioterapis telah menambahkan panduan Home Exercise Program (Cat-Camel, Bird-Dog, Pelvic Tilt) di akun Anda.',
      actionUrl: '/dashboard',
      isRead: false,
      createdAt: new Date('2026-10-23T12:35:00.000Z'),
    },
    {
      userId,
      title: 'Catatan Perkembangan Terapi Tersedia',
      message:
        'Ringkasan hasil evaluasi klinis dan perkembangan skor pemulihan Anda telah diperbarui oleh fisioterapis.',
      actionUrl: '/dashboard/progress',
      isRead: false,
      createdAt: new Date('2026-10-26T11:05:00.000Z'),
    },
  ];

  for (const notif of recentNotifs) {
    await db.insert(notifications).values(notif);
  }
  console.log('✓ Notifikasi klinis baru berhasil ditambahkan');

  console.log('--- Semua data pasien untuk terapis@test.com berhasil diperbarui secara realistis! ---');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error saat memperbarui data:', err);
    process.exit(1);
  });
