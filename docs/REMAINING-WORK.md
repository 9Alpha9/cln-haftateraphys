---
title: Hafta Fisioterapi — Remaining Work & Release Blockers
version: 1.0.0
last_updated: 2026-11-16
status: active-backlog
source: artifacts/qa/qa-report-hafta-2026-11-16.pdf
---

# Remaining Work

Dokumen ini adalah **memori kerja** untuk sisa temuan audit QA/pentest yang belum
dikerjakan atau belum dapat ditutup penuh. Baca dokumen ini sebelum memulai
pekerjaan lanjutan.

## Sudah selesai pada audit 2026-11-16

- Otorisasi klinis terapis (assignment aktif) dan intake IDOR.
- Kredensial auth tidak lagi bisa masuk query string sebelum hidrasi.
- Sinkronisasi rekam medis → pasien → PDF, termasuk informasi terapi, rencana
  terapi, program latihan, dan footer/lembar pengesahan.
- Footer PDF: halaman sendiri untuk dokumen >1 halaman, tanpa halaman kosong.
- Halaman error 401/403/404/500/503 + `/status` dan referensi insiden.
- Mode maintenance global + countdown + kontrol Super Admin.
- Landing page memakai Hafta Orange 300; ikon tetap memakai warna lama.
- Design docs diselaraskan (Orange 300 + Inter).
- Jam operasional disinkronkan dengan Google Business Profile:
  Senin–Jumat 09.00–19.00, Sabtu 09.00–17.00, Minggu tutup.
- `robots.txt`, `sitemap.xml`, kontras A11y, ARIA, dan navigasi aktif landing.
- Mobile 390 px diverifikasi untuk landing, maintenance, dan preview PDF.

## Prioritas P0 — blocker produksi

### 1. Rate limiting autentikasi dan operasi sensitif

- [x] Rate limit per IP untuk sign-in, sign-up, request/reset password, dan
      kirim ulang verifikasi — memakai tabel `rate_limit_hits` (Neon Postgres),
      jadi berlaku lintas instance, bukan in-memory.
- [x] Respons 429 dengan `Retry-After`; fail-open bila database bermasalah agar
      gangguan DB tidak mengunci semua pengguna.
- [ ] Rate limit per akun (butuh identitas akun dari body) — belum.
- [ ] Rate limit ekspor/unduh sensitif — belum.
- [ ] Audit kegagalan login otomatis — belum.
- Acceptance: percobaan berulang tidak dapat melakukan brute force tanpa hambatan.
- Bukti: 17 percobaan login beruntun → 15× 401 lalu **429** (`retry-after: 48`),
  baris penghitung tersimpan di `rate_limit_hits`.

### 2. Content-Security-Policy

- [x] CSP per-request dengan **nonce** dibuat di `proxy.ts`
      (`lib/security/csp.ts`), header statis di `next.config.ts` dihapus agar
      tidak ada dua CSP yang saling mengiris.
- [x] `script-src` tanpa `unsafe-inline` (nonce + `strict-dynamic`);
      `unsafe-eval` hanya di development.
- [x] Seluruh halaman dipaksa dinamis (`connection()` di root layout) karena
      nonce hanya bisa disuntikkan pada render per-request.
- [x] Diuji tanpa pelanggaran: login, dashboard, pratinjau PDF (blob/self),
      pratinjau dokumen (blob), Google Maps iframe, avatar ulasan.
- [ ] `style-src` masih `'unsafe-inline'` — framer-motion & style inline
      membutuhkannya; perlu kajian lanjutan untuk menghapus.
- Acceptance: tidak ada pelanggaran CSP pada alur login, dashboard, dan cetak PDF.
  **Tercapai** (lihat hasil uji di atas).

### 3. Backup, restore, dan retensi rekam medis

- [ ] Dokumentasikan backup Neon + R2.
- [ ] Uji restore di environment terpisah.
- [ ] Tetapkan retensi/arsip rekam medis bersama pemilik klinik.
- [ ] Tetapkan incident owner dan target recovery.
- Acceptance: prosedur restore terbukti, bukan hanya diasumsikan.

### 4. Test authorization regresi

- [x] Therapist unassigned tidak bisa read/write rekam medis.
- [x] Therapist unassigned tidak bisa melihat/mengekspor intake.
- [x] Patient tidak bisa membuka dokumen/record pasien lain.
- [x] Super Admin tanpa clinical permission tidak bisa membuka rekam medis.
- Acceptance: test gagal jika scope assignment dihapus dari query/action.
- Status: `tests/authorization/clinical-scope.test.ts` (33 test) mencakup tulis
      rekam, baca rekam (`getTherapyProgressById`), metadata/lampiran rekam,
      surat intake, unduh dokumen, IDOR pasien, dan matriks izin lintas peran.

## Prioritas P1 — sebelum rilis stabil

### 5. Mobile Gate penuh

- [x] 320 px, 360 px, 390 px, 430 px.
- [x] 768 px dan 834 px tablet.
- [x] 1024/1280/1440 px desktop.
- Halaman diuji: `/`, `/login`, `/kontak`, `/maintenance`, `/dashboard`,
  `/dashboard/documents`, `/dashboard/progress`, `/dashboard/patients`, serta
  portal pasien (`/dashboard`, `/dashboard/progress`, `/dashboard/history`).
- Hasil: **overflow horizontal 0 px di semua kombinasi** (metode iframe
  berlebar terkunci; `scrollWidth - clientWidth`).
- [x] Tap target utama halaman Dokumen: pencarian, Filter, dan Unggah kini
  **44 px** di mobile; tombol hapus ikon memakai utilitas `.tap-target`
  (area sentuh 44 px tanpa mengubah ukuran visual).
- [ ] Sisa: beberapa kontrol bersama (pagination, tombol ikon lain) masih 40 px
  dan breadcrumb berupa tautan teks — perlu pass desain terpisah bila ingin
  seluruhnya ≥44 px.
- Acceptance: tidak ada body-level horizontal scroll **tercapai**; tap target
  utama sebagian tercapai (lihat sisa di atas).

### 6. Halaman dokumen pasien

- [x] Route `/dashboard/documents` untuk USER (aturan route `ALL_ROLES`,
      guard halaman memakai `document:read-own`).
- [x] Hanya dokumen `patient_visible` milik pasien sendiri (filter query pada
      `patients.user_id`, `patient_visible = 1`, status `ACTIVE`).
- [x] Unduh lewat `/api/documents/[id]` yang diproteksi + audit
      (`document.download`).
- [x] Navigasi pasien: menu **Terapi → Dokumen**.
- Bukti uji: pasien Budi melihat 8 dokumen miliknya; unduh dokumen sendiri
  `200 image/png`; dokumen pasien lain `403`; dokumen internal tidak muncul.
- Catatan: tombol unggah/hapus otomatis tidak tampil untuk pasien.
- Acceptance: object-level authorization diuji untuk pasien lain.

### 7. Halaman Super Admin yang belum ada

- [ ] `/dashboard/users/[userId]` detail pengguna.
- [ ] `/dashboard/roles` (v1 boleh read-only code-defined matrix).
- [ ] `/dashboard/staff` atau dokumentasikan resmi sebagai out-of-scope v1.
- Acceptance: route tidak muncul di navigasi jika belum diimplementasikan, dan
      keputusan scope dicatat di PRD.

### 8. Monitoring error produksi

- [ ] Integrasi Sentry/OpenTelemetry.
- [ ] Redaksi ketat: tanpa nama, kontak, diagnosis, isi rekam medis, token, cookie.
- [ ] Hubungkan digest error boundary dengan referensi insiden.
- Acceptance: error produksi dapat ditelusuri tanpa data pasien.

## Prioritas P2 — peningkatan

### 9. Dead UI primitives

- [ ] Putuskan hapus/dipertahankan: `components/ui/pagination.tsx`,
      `tabs.tsx`, `sheet.tsx`, `chart.tsx`.
- Acceptance: tidak ada komponen tanpa pemilik/roadmap.

### 10. Fallback preview PDF

- [x] Pratinjau rekam medis dirender di modal (iframe satu tingkat) agar viewer PDF
      tidak kosong karena iframe bertingkat.
- [x] Toolbar tambahan (Cetak/Unduh PDF/Buka di tab) dihapus: viewer PDF bawaan
      sudah menyediakan cetak dan unduh, sehingga seluruh alur selesai di modal.
- [x] Tombol Coba lagi saat PDF gagal dibuat.
- Catatan CSP: `connect-src` wajib memuat `data:`/`blob:` dan `worker-src` wajib
      memuat `blob:`; tanpa itu `@react-pdf/renderer` (WASM Yoga + worker) macet
      di status "Menyiapkan dokumen PDF…". Lihat `next.config.ts`.
- **Iframe PDF diganti penampil canvas (pdf.js).** Iframe hanya bekerja bila
  browser punya viewer PDF internal; iOS Safari tidak punya toolbar, dan sebagian
  browser Android (Firefox, Samsung Internet) tidak merender PDF di iframe sama
  sekali. Sekarang halaman PDF digambar ke `<canvas>` lewat `pdfjs-dist`
  (`components/pdf/pdf-canvas-viewer.tsx`) sehingga tampil di semua browser,
  dengan toolbar sendiri (**Unduh PDF**, **Cetak**) dan cetak via `window.print`
  (CSS `body:has(.pdf-print-root)` hanya mencetak kanvas dokumen). Modal pratinjau
  full screen di mobile (`100dvh`, safe-area atas).
- Kinerja render PDF:
  - logo PDF memakai aset ringan `logos-text-pdf.png` (59 KB) — render 3,8 s → ~1,2 s
    dan ukuran PDF 1,39 MB → 72 KB;
  - lampiran R2 diambil paralel (bukan berurutan);
  - cache render server 60 detik (kunci `id + updatedAt + jumlah lampiran`);
  - halaman dirender bertahap (canvas placeholder + IntersectionObserver);
  - cache byte PDF di klien 20 detik.
  Hasil ukur (dev): buka pertama ~1,9 s, buka ulang ~0,7 s.

### 11. Rate limit/cache endpoint publik

- [ ] `/api/reviews` — cache dan batasi request berlebihan.
- [ ] Pastikan respons tidak membocorkan data internal.

### 12. Perbarui laporan QA setiap rilis

- [ ] Regenerate `artifacts/qa/qa-report-hafta-<tanggal>.pdf`.
- [ ] Perbarui status temuan di `scripts/qa/qa-report-data.ts`.
- [ ] Simpan screenshot bukti baru di `artifacts/qa/screenshots/`.

## Cara menjalankan quality gate

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint .
./node_modules/.bin/vitest run
corepack pnpm build
```

Generator laporan QA: lihat `scripts/qa/README.md`.
