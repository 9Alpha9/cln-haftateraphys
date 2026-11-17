import type { Metadata } from 'next';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { PublicHeader } from '@/components/landing/navbar';
import { LegalDocument, type LegalSection } from '@/components/legal/legal-document';
import { CLINIC_HOURS } from '@/lib/clinic-hours';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Hafta Fisioterapi',
  description:
    'Syarat dan Ketentuan penggunaan situs web, Patient Portal, dan layanan fisioterapi Hafta Fisioterapi Sidoarjo.',
};

const sections: LegalSection[] = [
  {
    id: 'penerimaan-syarat',
    title: 'Penerimaan syarat',
    blocks: [
      {
        type: 'paragraph',
        text: 'Dengan mengakses situs web, membuat akun, atau menggunakan layanan Hafta Fisioterapi, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat dan Ketentuan ini beserta Kebijakan Privasi yang merupakan bagian tidak terpisahkan darinya.',
      },
      {
        type: 'paragraph',
        text: 'Apabila Anda tidak menyetujui sebagian atau seluruh ketentuan ini, mohon untuk tidak menggunakan layanan digital kami. Ketentuan ini tidak membatasi hak Anda sebagai konsumen maupun pasien yang dijamin oleh peraturan perundang-undangan.',
      },
      {
        type: 'paragraph',
        text: 'Apabila Anda mendaftarkan akun atas nama pasien lain, termasuk anak atau anggota keluarga yang menjadi tanggungan Anda, Anda menyatakan berwenang mewakili pasien tersebut dan bertanggung jawab atas kebenaran data yang diberikan.',
      },
    ],
  },
  {
    id: 'definisi',
    title: 'Definisi',
    blocks: [
      {
        type: 'definition',
        items: [
          {
            term: 'Layanan',
            description:
              'Jasa fisioterapi yang diselenggarakan Hafta Fisioterapi, meliputi asesmen, terapi klinis, rehabilitasi pasca operasi dan cedera, layanan kunjungan rumah (home visit) di wilayah Sidoarjo, serta pendampingan fisioterapi di lapangan.',
          },
          {
            term: 'Patient Portal',
            description:
              'Fitur akun daring pada situs web ini yang memungkinkan pasien melihat jadwal, rekam terapi, program latihan mandiri, dan dokumen yang dinyatakan dapat diakses pasien.',
          },
          {
            term: 'Rekam Medis',
            description:
              'Dokumen berisi data identitas pasien, hasil pemeriksaan, diagnosis, rencana terapi, tindakan, dan catatan perkembangan yang dibuat oleh fisioterapis dalam penyelenggaraan pelayanan.',
          },
          {
            term: 'Fisioterapis',
            description:
              'Tenaga kesehatan yang memberikan pelayanan fisioterapi di Hafta Fisioterapi dan memiliki kewenangan sesuai ketentuan yang berlaku.',
          },
        ],
      },
    ],
  },
  {
    id: 'sifat-informasi',
    title: 'Sifat informasi pada situs web',
    blocks: [
      {
        type: 'paragraph',
        text: 'Seluruh informasi pada situs web ini, termasuk artikel, penjelasan layanan, dan materi edukasi, bersifat informatif dan umum. Informasi tersebut bukan merupakan diagnosis, resep, atau pengganti pemeriksaan langsung oleh fisioterapis maupun dokter.',
      },
      {
        type: 'paragraph',
        text: 'Anda tidak disarankan melakukan tindakan terapi atau latihan berdasarkan informasi di situs ini tanpa asesmen terlebih dahulu. Hentikan latihan dan hubungi kami atau tenaga kesehatan terdekat apabila muncul nyeri hebat, pusing, sesak, atau keluhan yang memberat.',
      },
      {
        type: 'paragraph',
        text: 'Apabila terjadi keadaan darurat medis, segera hubungi layanan gawat darurat terdekat. Situs web dan Patient Portal tidak dirancang untuk menangani kondisi kegawatdaruratan.',
      },
    ],
  },
  {
    id: 'akun-dan-keamanan',
    title: 'Akun dan keamanan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas yang terjadi melalui akun Anda. Jangan membagikan kredensial akun kepada siapa pun, termasuk kepada pihak yang mengaku sebagai staf Hafta Fisioterapi.',
      },
      {
        type: 'list',
        items: [
          'Kami tidak pernah meminta kata sandi Anda melalui WhatsApp, telepon, atau email.',
          'Gunakan kata sandi yang unik dan tidak dipakai pada layanan lain. Pengelola kata sandi diperbolehkan.',
          'Segera ubah kata sandi dan hubungi kami apabila Anda menduga akun Anda diakses pihak lain tanpa hak.',
          'Kami dapat menangguhkan sementara akses akun apabila mendeteksi indikasi penyalahgunaan, dengan pemberitahuan kepada Anda.',
          'Sesi masuk dapat berakhir otomatis setelah jangka waktu tidak ada aktivitas, sesuai kebijakan keamanan yang berlaku untuk peran pengguna.',
        ],
      },
    ],
  },
  {
    id: 'kewajiban-pasien',
    title: 'Kewajiban dan tanggung jawab pasien',
    blocks: [
      {
        type: 'list',
        items: [
          'Memberikan informasi yang benar, lengkap, dan terbaru mengenai identitas, keluhan, riwayat penyakit, obat yang dikonsumsi, serta alergi yang Anda ketahui.',
          'Memberitahukan kepada fisioterapis apabila kondisi Anda berubah, sedang hamil, baru menjalani operasi, atau memiliki kondisi medis lain yang relevan.',
          'Mengikuti instruksi dan program latihan sesuai arahan fisioterapis, serta melaporkan apabila latihan menimbulkan keluhan.',
          'Hadir tepat waktu sesuai jadwal atau memberitahukan pembatalan sesuai ketentuan penjadwalan.',
          'Menjaga ketertiban, privasi pasien lain, dan tidak merekam atau mendokumentasikan pasien lain tanpa izin.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Hasil terapi dipengaruhi oleh banyak faktor, termasuk kondisi klinis, kepatuhan menjalani program, dan faktor individual lainnya. Kami tidak menjanjikan hasil pemulihan tertentu, dan fisioterapis akan menjelaskan prognosis secara wajar berdasarkan temuan asesmen.',
      },
    ],
  },
  {
    id: 'penjadwalan',
    title: 'Penjadwalan, pembatalan, dan ketidakhadiran',
    blocks: [
      {
        type: 'paragraph',
        text: 'Jadwal sesi dapat diajukan melalui Patient Portal atau kanal komunikasi resmi dan dinyatakan berlaku setelah dikonfirmasi oleh Hafta Fisioterapi. Ketersediaan fisioterapis dan slot waktu dapat berubah sewaktu-waktu.',
      },
      {
        type: 'list',
        items: [
          'Apabila Anda perlu membatalkan atau menjadwalkan ulang, mohon memberitahukan sesegera mungkin agar slot dapat digunakan pasien lain.',
          'Apabila Anda tidak hadir tanpa pemberitahuan, kami dapat mencatat ketidakhadiran tersebut pada riwayat jadwal Anda.',
          'Hafta Fisioterapi dapat menjadwalkan ulang atau membatalkan sesi karena keadaan di luar kendali, seperti kondisi fisioterapis, keadaan darurat, atau force majeure, dan akan menawarkan jadwal pengganti.',
          'Ketentuan biaya, paket sesi, dan pembatalan yang menimbulkan konsekuensi biaya akan dijelaskan secara terpisah oleh admin klinik sebelum layanan dilaksanakan.',
        ],
      },
    ],
  },
  {
    id: 'rekam-medis',
    title: 'Rekam medis dan hasil terapi',
    blocks: [
      {
        type: 'paragraph',
        text: 'Fisioterapis wajib menyelenggarakan rekam medis atas setiap pelayanan yang diberikan. Rekam medis merupakan milik fasilitas pelayanan kesehatan, sedangkan isinya merupakan hak pasien untuk diketahui dan diperoleh salinannya sesuai ketentuan yang berlaku.',
      },
      {
        type: 'paragraph',
        text: 'Rekam medis yang telah difinalisasi tidak diubah secara diam-diam. Koreksi dilakukan melalui mekanisme amandemen yang mencatat waktu, alasan, dan pihak yang melakukan koreksi sehingga riwayat klinis tetap utuh dan dapat diaudit.',
      },
      {
        type: 'paragraph',
        text: 'Dokumen dan foto hanya ditampilkan pada Patient Portal apabila ditandai dapat diakses pasien oleh fisioterapis. Anda dapat meminta salinan rekam medis melalui kanal resmi dengan menyertakan bukti identitas.',
      },
    ],
  },
  {
    id: 'persetujuan-klinis',
    title: 'Persetujuan tindakan dan publikasi',
    blocks: [
      {
        type: 'paragraph',
        text: 'Sebelum tindakan fisioterapi tertentu, fisioterapis akan menjelaskan tujuan, prosedur, manfaat, dan risikonya. Persetujuan tindakan klinis Anda berikan secara terpisah dan dapat ditarik sebelum tindakan dilaksanakan.',
      },
      {
        type: 'paragraph',
        text: 'Persetujuan publikasi media dan testimoni bersifat opsional, terpisah dari persetujuan layanan, dan tidak pernah menjadi syarat untuk memperoleh terapi. Anda dapat menariknya kapan saja, dan penarikan tersebut tidak memengaruhi layanan yang sedang berjalan.',
      },
    ],
  },
  {
    id: 'penggunaan-yang-dilarang',
    title: 'Penggunaan yang dilarang',
    blocks: [
      {
        type: 'paragraph',
        text: 'Anda tidak diperkenankan menggunakan situs web atau Patient Portal untuk:',
      },
      {
        type: 'numbered',
        items: [
          'Mengakses, mencoba mengakses, atau mengunduh data milik pasien lain tanpa hak.',
          'Mengunggah atau mengirimkan konten yang melanggar hukum, menyesatkan, memfitnah, atau melanggar hak kekayaan intelektual pihak lain.',
          'Mengganggu, membebani secara berlebihan, atau mencoba menembus keamanan sistem, termasuk pengujian penetrasi tanpa izin tertulis.',
          'Menggunakan perangkat otomatis untuk mengambil data secara massal (scraping) tanpa persetujuan kami.',
          'Menyalahgunakan layanan untuk memperoleh resep, surat keterangan, atau dokumen lain secara tidak sah.',
          'Menggunakan data pasien yang Anda akses untuk tujuan di luar pelayanan kesehatan yang bersangkutan.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Pelanggaran atas ketentuan ini dapat mengakibatkan penangguhan akun dan, apabila berkaitan dengan data pasien atau keamanan sistem, dapat kami laporkan kepada pihak berwenang sesuai ketentuan hukum yang berlaku.',
      },
    ],
  },
  {
    id: 'kekayaan-intelektual',
    title: 'Kekayaan intelektual',
    blocks: [
      {
        type: 'paragraph',
        text: 'Nama, logo, tampilan, tata letak, tulisan, gambar, dan materi lain pada situs web ini dilindungi hak kekayaan intelektual Hafta Fisioterapi atau pemberi lisensinya. Anda tidak diperkenankan menyalin, memodifikasi, atau menggunakan materi tersebut untuk kepentingan komersial tanpa izin tertulis.',
      },
      {
        type: 'paragraph',
        text: 'Program latihan dan materi edukasi yang diberikan kepada Anda secara individual boleh Anda gunakan untuk keperluan pemulihan pribadi, namun tidak untuk dipublikasikan ulang atau diperjualbelikan.',
      },
    ],
  },
  {
    id: 'batasan-tanggung-jawab',
    title: 'Batasan tanggung jawab',
    blocks: [
      {
        type: 'paragraph',
        text: 'Situs web dan Patient Portal disediakan sebagaimana adanya. Kami berupaya menjaga ketersediaan dan ketepatan sistem, namun tidak menjamin bahwa layanan digital akan selalu bebas gangguan, bebas kesalahan, atau tersedia tanpa pemeliharaan.',
      },
      {
        type: 'paragraph',
        text: 'Sepanjang diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan situs web, termasuk kehilangan data akibat gangguan jaringan atau perangkat milik Anda, kecuali kerugian tersebut disebabkan oleh kelalaian atau kesengajaan kami.',
      },
      {
        type: 'paragraph',
        text: 'Ketentuan ini tidak mengurangi tanggung jawab kami atas pelayanan kesehatan yang kami selenggarakan, termasuk tanggung jawab profesional fisioterapis sesuai kewenangan dan standar pelayanan yang berlaku.',
      },
    ],
  },
  {
    id: 'hukum-yang-berlaku',
    title: 'Hukum yang berlaku dan penyelesaian sengketa',
    blocks: [
      {
        type: 'paragraph',
        text: 'Syarat dan Ketentuan ini tunduk pada hukum yang berlaku di Negara Kesatuan Republik Indonesia.',
      },
      {
        type: 'paragraph',
        text: 'Apabila timbul perselisihan, kami mengutamakan penyelesaian secara musyawarah melalui kanal kontak resmi. Apabila musyawarah tidak mencapai kesepakatan, para pihak dapat menempuh penyelesaian sengketa melalui Badan Penyelesaian Sengketa Konsumen atau pengadilan yang berwenang, sesuai ketentuan peraturan perundang-undangan.',
      },
    ],
  },
  {
    id: 'ketentuan-umum',
    title: 'Ketentuan umum',
    blocks: [
      {
        type: 'definition',
        items: [
          {
            term: 'Keterpisahan',
            description:
              'Apabila salah satu ketentuan dalam dokumen ini dinyatakan tidak sah atau tidak dapat dilaksanakan oleh pihak yang berwenang, ketentuan tersebut akan ditafsirkan ulang sejauh mungkin agar tujuannya tetap tercapai, dan ketentuan lainnya tetap berlaku penuh.',
          },
          {
            term: 'Keseluruhan perjanjian',
            description:
              'Syarat dan Ketentuan ini beserta Kebijakan Privasi merupakan keseluruhan kesepahaman antara Anda dan kami mengenai penggunaan layanan digital, dan menggantikan ketentuan lisan maupun tertulis sebelumnya yang bertentangan.',
          },
          {
            term: 'Bahasa',
            description:
              'Dokumen ini disusun dalam Bahasa Indonesia. Apabila di kemudian hari tersedia terjemahan dalam bahasa lain, versi Bahasa Indonesia yang berlaku apabila terdapat perbedaan penafsiran.',
          },
          {
            term: 'Tidak melepaskan hak',
            description:
              'Apabila kami tidak segera menegakkan suatu ketentuan, hal tersebut tidak berarti kami melepaskan hak untuk menegakkannya di kemudian hari.',
          },
        ],
      },
    ],
  },
  {
    id: 'perubahan-ketentuan',
    title: 'Perubahan ketentuan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kami dapat memperbarui Syarat dan Ketentuan ini apabila terdapat perubahan layanan, ketentuan hukum, atau praktik operasional. Versi terbaru selalu tersedia pada halaman ini beserta tanggal berlaku dan tanggal pembaruan.',
      },
      {
        type: 'paragraph',
        text: 'Dengan tetap menggunakan layanan setelah perubahan berlaku, Anda dianggap menyetujui ketentuan yang diperbarui. Apabila Anda tidak menyetujui perubahan tersebut, Anda dapat berhenti menggunakan layanan digital dan menghubungi kami untuk pengaturan lebih lanjut.',
      },
    ],
  },
];

export default function TermsPage() {
  // Jam layanan diambil dari satu sumber kebenaran agar tidak berbeda dengan
  // halaman kontak dan profil Google Business.
  const clinicHours = CLINIC_HOURS.map((entry) => `${entry.day} ${entry.hours}`).join(', ');

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Container>
          <div className="py-12 md:py-16">
            <LegalDocument
              title="Syarat & Ketentuan"
              effectiveDate="1 November 2026"
              updatedDate="17 November 2026"
              summary="Ketentuan ini mengatur penggunaan situs web, Patient Portal, dan layanan fisioterapi Hafta Fisioterapi. Kami menuliskannya agar mudah dipahami, sekaligus tetap memuat hak dan kewajiban kedua belah pihak secara jelas."
              relatedLink={{ href: '/privacy', label: 'Baca juga Kebijakan Privasi' }}
              sections={sections}
              contactNote="Apabila ada bagian dari ketentuan ini yang belum jelas, atau Anda ingin mengajukan pertanyaan sebelum menggunakan layanan, silakan hubungi kami melalui kanal resmi berikut."
              contactDetail={`Hafta Fisioterapi berkedudukan di Jl. Pd. Sidokare Indah No.AE-13, Cangkring, Sidokare, Kecamatan Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61214. Jam layanan: ${clinicHours}.`}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
