import type { Metadata } from 'next';
import { Container } from '@/components/container';
import { Footer } from '@/components/landing/footer';
import { PublicHeader } from '@/components/landing/navbar';
import { LegalDocument, type LegalSection } from '@/components/legal/legal-document';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Hafta Fisioterapi',
  description:
    'Kebijakan Privasi Hafta Fisioterapi: data apa yang dikumpulkan, dasar pemrosesan, penyimpanan, pembagian, dan hak Anda sebagai pasien.',
};

const sections: LegalSection[] = [
  {
    id: 'ruang-lingkup',
    title: 'Ruang lingkup dan identitas pengendali data',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kebijakan Privasi ini berlaku atas seluruh pemrosesan data pribadi yang dilakukan oleh Hafta Fisioterapi, sebuah layanan fisioterapi yang berkedudukan di Jl. Pd. Sidokare Indah No.AE-13, Cangkring, Sidokare, Kecamatan Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61214, termasuk melalui situs web ini, Patient Portal, layanan kunjungan rumah (home visit), dan kegiatan terapi di lapangan.',
      },
      {
        type: 'paragraph',
        text: 'Dalam kebijakan ini, "kami" merujuk pada Hafta Fisioterapi, dan "Anda" merujuk pada pasien, wali atau pendamping pasien, serta pengunjung situs web. Hafta Fisioterapi bertindak sebagai pengendali data pribadi atas data yang dijelaskan di bawah ini.',
      },
      {
        type: 'paragraph',
        text: 'Kebijakan ini disusun dengan memperhatikan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik, serta ketentuan peraturan perundang-undangan di bidang kesehatan dan rekam medis yang berlaku di Indonesia.',
      },
    ],
  },
  {
    id: 'data-yang-kami-kumpulkan',
    title: 'Data pribadi yang kami kumpulkan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kami mengumpulkan data secara terbatas pada apa yang diperlukan untuk memberikan layanan fisioterapi dan mengoperasikan Patient Portal. Kami tidak meminta data yang tidak relevan dengan tujuan tersebut.',
      },
      {
        type: 'definition',
        items: [
          {
            term: 'Data identitas dan kontak',
            description:
              'Nama lengkap, alamat email, nomor telepon atau WhatsApp, tanggal lahir, jenis kelamin, alamat domisili, dan pekerjaan. Data ini kami gunakan untuk membuat akun, menghubungi Anda terkait jadwal, dan mencocokkan identitas pada saat kunjungan.',
          },
          {
            term: 'Data akun dan keamanan',
            description:
              'Kata sandi yang disimpan dalam bentuk hash oleh penyedia autentikasi kami, riwayat masuk, alamat IP, dan informasi perangkat yang diperlukan untuk menjaga keamanan akun. Kami tidak pernah menyimpan kata sandi dalam bentuk teks terbuka.',
          },
          {
            term: 'Data kesehatan dan asesmen awal',
            description:
              'Keluhan utama, area tubuh yang dikeluhkan, awal dan pemicu keluhan, faktor yang memperberat atau meredakan, keterbatasan aktivitas harian, riwayat cedera, riwayat operasi, riwayat medis, obat yang sedang digunakan, alergi, serta target pemulihan yang Anda sampaikan melalui formulir asesmen awal.',
          },
          {
            term: 'Data klinis dan rekam medis',
            description:
              'Hasil pemeriksaan fisik, diagnosis fisioterapi, indikator fungsional (skala nyeri, rentang gerak, kekuatan otot, fungsi), catatan sesi terapi, rencana terapi, program latihan mandiri, evaluasi, dan catatan tindak lanjut yang dibuat oleh fisioterapis.',
          },
          {
            term: 'Dokumen dan foto pendukung',
            description:
              'Hasil pemeriksaan penunjang yang Anda unggah secara sukarela, seperti foto rontgen, MRI, atau hasil laboratorium, serta foto kondisi atau hasil pemeriksaan yang diambil sebagai bagian dari dokumentasi terapi. Unggahan dokumen bersifat opsional dan ditampilkan hanya kepada Anda dan fisioterapis yang menangani.',
          },
          {
            term: 'Data jadwal dan transaksi layanan',
            description:
              'Jadwal sesi, jenis kunjungan (klinik, home visit, atau on-field), status kehadiran, pembatalan, penjadwalan ulang, serta catatan administratif yang berkaitan dengan pelaksanaan layanan.',
          },
          {
            term: 'Data komunikasi',
            description:
              'Isi pesan yang Anda kirimkan kepada kami melalui WhatsApp, formulir kontak, atau saluran komunikasi resmi lainnya, sepanjang diperlukan untuk menindaklanjuti permintaan Anda.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'Situs web ini tidak menggunakan layanan analitik pihak ketiga untuk memprofilkan perilaku pengunjung, dan kami tidak memasang cookie periklanan. Cookie yang digunakan hanya bersifat teknis, yaitu untuk menjaga sesi masuk dan preferensi tampilan yang Anda pilih sendiri.',
      },
    ],
  },
  {
    id: 'dasar-pemrosesan',
    title: 'Dasar dan tujuan pemrosesan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kami memproses data pribadi Anda atas dasar berikut:',
      },
      {
        type: 'list',
        items: [
          'Persetujuan yang Anda berikan secara sadar dan eksplisit, khususnya untuk pemrosesan data kesehatan, unggahan dokumen pendukung, dan publikasi media atau testimoni.',
          'Pelaksanaan perjanjian layanan, yaitu ketika pemrosesan diperlukan untuk menyelenggarakan asesmen, sesi terapi, dan tindak lanjut yang Anda minta.',
          'Pemenuhan kewajiban hukum, termasuk penyelenggaraan, penyimpanan, dan pemeliharaan rekam medis sesuai ketentuan peraturan perundang-undangan.',
          'Kepentingan yang sah dan proporsional, terbatas pada keamanan sistem, pencegahan penyalahgunaan akun, serta peningkatan mutu layanan, dengan tetap menghormati hak Anda.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Persetujuan untuk pemrosesan data kesehatan dan persetujuan publikasi media atau testimoni kami minta secara terpisah. Persetujuan publikasi bersifat opsional, tidak pernah digabung dengan persetujuan layanan klinis, dan dapat Anda tarik kapan saja tanpa memengaruhi hak Anda memperoleh layanan terapi.',
      },
    ],
  },
  {
    id: 'penyimpanan-dan-keamanan',
    title: 'Penyimpanan dan keamanan data',
    blocks: [
      {
        type: 'paragraph',
        text: 'Data akun dan rekam medis disimpan pada basis data terkelola dengan enkripsi saat transit dan saat disimpan. Dokumen serta foto pendukung disimpan pada penyimpanan objek privat yang tidak dapat diakses melalui tautan publik; akses diberikan melalui endpoint yang memverifikasi sesi dan kepemilikan data terlebih dahulu.',
      },
      {
        type: 'list',
        items: [
          'Setiap akses ke rekam medis, unggahan dokumen, ekspor, dan perubahan data klinis dicatat dalam jejak audit yang tidak dapat diubah pengguna.',
          'Akses terhadap data klinis dibatasi pada fisioterapis yang ditugaskan menangani Anda dan staf yang memerlukannya untuk keperluan operasional.',
          'Sesi masuk memiliki masa berlaku terbatas dan berakhir otomatis ketika tidak ada aktivitas dalam jangka waktu tertentu, sesuai peran pengguna.',
          'Kata sandi disimpan dalam bentuk hash oleh penyedia autentikasi kami dan tidak pernah ditulis ke dalam log aplikasi.',
          'Rekam medis tidak dihapus secara permanen sebagai akibat dari penutupan akun; koreksi dilakukan melalui mekanisme amandemen agar riwayat klinis tetap utuh sesuai ketentuan rekam medis.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Meskipun kami menerapkan langkah teknis dan organisasi yang wajar, tidak ada sistem yang sepenuhnya bebas dari risiko. Apabila terjadi kegagalan pelindungan data pribadi yang berdampak pada Anda, kami akan memberitahukan secara tertulis sesuai jangka waktu yang diwajibkan peraturan perundang-undangan.',
      },
    ],
  },
  {
    id: 'pembagian-data',
    title: 'Pembagian data kepada pihak lain',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda. Data hanya dibagikan dalam keadaan berikut:',
      },
      {
        type: 'list',
        items: [
          'Kepada penyedia infrastruktur yang kami gunakan untuk menjalankan layanan, seperti penyedia basis data, penyimpanan berkas, dan pengiriman email transaksional, yang terikat kewajiban kerahasiaan dan hanya memproses data atas instruksi kami.',
          'Kepada tenaga kesehatan atau fasilitas kesehatan lain, hanya apabila Anda memberikan persetujuan atau apabila diwajibkan untuk kelangsungan pelayanan dan rujukan.',
          'Kepada pihak berwenang, apabila terdapat kewajiban hukum, permintaan resmi yang sah, atau keperluan penegakan hukum.',
          'Kepada penasihat hukum atau auditor, apabila diperlukan untuk melindungi hak kami, dengan pembatasan akses seminimal mungkin.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Kami tidak mengirimkan data pasien ke layanan kecerdasan buatan pihak ketiga untuk keperluan pelatihan model, dan tidak menggunakan data klinis Anda untuk keperluan pemasaran.',
      },
    ],
  },
  {
    id: 'penyimpanan-jangka-waktu',
    title: 'Jangka waktu penyimpanan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Rekam medis disimpan untuk jangka waktu yang ditentukan oleh peraturan perundang-undangan di bidang rekam medis dan kebijakan internal klinik, termasuk setelah hubungan layanan berakhir, karena fungsinya sebagai bukti penyelenggaraan pelayanan kesehatan.',
      },
      {
        type: 'paragraph',
        text: 'Data akun yang tidak lagi diperlukan untuk penyelenggaraan layanan dapat dihapus atau dianonimkan, kecuali data tersebut menyatu dengan rekam medis yang wajib disimpan. Data pemasaran, apabila ada, disimpan hanya selama persetujuan masih berlaku.',
      },
    ],
  },
  {
    id: 'hak-anda',
    title: 'Hak Anda sebagai subjek data',
    blocks: [
      {
        type: 'paragraph',
        text: 'Sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda berhak:',
      },
      {
        type: 'numbered',
        items: [
          'Memperoleh informasi mengenai identitas pengendali data, dasar dan tujuan pemrosesan, serta jangka waktu penyimpanan.',
          'Mengakses dan memperoleh salinan data pribadi Anda yang kami kelola.',
          'Meminta pembaruan atau perbaikan atas data yang tidak akurat, dengan memperhatikan ketentuan bahwa koreksi atas rekam medis dilakukan melalui mekanisme amandemen agar riwayat tetap terekam.',
          'Menarik persetujuan atas pemrosesan yang sebelumnya Anda berikan, termasuk persetujuan publikasi media atau testimoni.',
          'Mengajukan keberatan atas pemrosesan tertentu dan meminta pembatasan pemrosesan sepanjang dimungkinkan secara hukum.',
          'Meminta penghapusan data pribadi, sepanjang tidak bertentangan dengan kewajiban penyimpanan rekam medis dan ketentuan hukum lainnya.',
          'Mengajukan gugatan dan memperoleh ganti rugi apabila terjadi pelanggaran pemrosesan data pribadi sesuai ketentuan peraturan perundang-undangan.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Permintaan dapat diajukan melalui kanal kontak resmi kami. Kami akan memverifikasi identitas pemohon terlebih dahulu untuk memastikan data tidak diserahkan kepada pihak yang tidak berhak. Apabila permintaan diajukan oleh wali, pendamping, atau kuasa hukum, kami dapat meminta bukti hubungan keluarga atau surat kuasa yang sah.',
      },
    ],
  },
  {
    id: 'anak-dan-wali',
    title: 'Data anak dan pasien dengan pendamping',
    blocks: [
      {
        type: 'paragraph',
        text: 'Untuk pasien yang belum cakap hukum atau memerlukan pendamping, pemrosesan data dilakukan berdasarkan persetujuan orang tua atau wali yang sah. Kami hanya mengumpulkan data anak sejauh diperlukan untuk penyelenggaraan layanan terapi dan tetap menerapkan prinsip minimisasi data.',
      },
    ],
  },
  {
    id: 'pembaruan-kebijakan',
    title: 'Perubahan kebijakan',
    blocks: [
      {
        type: 'paragraph',
        text: 'Kebijakan ini dapat kami perbarui apabila terjadi perubahan layanan, perubahan ketentuan hukum, atau peningkatan praktik pelindungan data. Versi terbaru selalu tersedia pada halaman ini beserta tanggal berlaku dan tanggal pembaruan.',
      },
      {
        type: 'paragraph',
        text: 'Apabila perubahan bersifat material dan memengaruhi hak Anda, kami akan menyampaikan pemberitahuan melalui email terdaftar atau kanal komunikasi resmi sebelum perubahan berlaku.',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Container>
          <div className="py-12 md:py-16">
            <LegalDocument
              title="Kebijakan Privasi"
              effectiveDate="1 November 2026"
              updatedDate="17 November 2026"
              summary="Kebijakan ini menjelaskan data pribadi apa yang kami kumpulkan, mengapa data tersebut diproses, bagaimana kami melindunginya, serta hak yang dapat Anda gunakan atas data Anda. Kami berupaya menuliskannya dengan bahasa yang mudah dipahami tanpa mengurangi ketepatan isinya."
              relatedLink={{ href: '/terms', label: 'Baca juga Syarat & Ketentuan layanan' }}
              sections={sections}
              contactNote="Pertanyaan, keberatan, atau permintaan terkait data pribadi Anda dapat disampaikan kepada kami melalui kanal resmi berikut."
              contactDetail="Hafta Fisioterapi berkedudukan di Jl. Pd. Sidokare Indah No.AE-13, Cangkring, Sidokare, Kecamatan Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61214. Mohon sertakan nama lengkap dan email akun yang terdaftar agar permintaan dapat kami tindak lanjuti."
            />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
