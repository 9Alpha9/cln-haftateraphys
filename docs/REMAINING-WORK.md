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

- [ ] Rate limit per IP + per akun untuk login, register, forgot/reset password,
      resend verification, dan ekspor/unduh sensitif.
- [ ] Implementasi harus bekerja di runtime deployment (bukan in-memory per instance).
- [ ] Respons 429 yang aman + audit kegagalan login.
- Acceptance: percobaan berulang tidak dapat melakukan brute force tanpa hambatan.

### 2. Content-Security-Policy

- [ ] Terapkan CSP di staging dengan nonce/hash untuk Next.js.
- [ ] Uji Better Auth, Google Maps iframe, gambar eksternal, dan PDF/blob.
- [ ] Jangan memakai `unsafe-inline` tanpa kajian.
- Acceptance: tidak ada pelanggaran CSP pada alur login, dashboard, dan cetak PDF.

### 3. Backup, restore, dan retensi rekam medis

- [ ] Dokumentasikan backup Neon + R2.
- [ ] Uji restore di environment terpisah.
- [ ] Tetapkan retensi/arsip rekam medis bersama pemilik klinik.
- [ ] Tetapkan incident owner dan target recovery.
- Acceptance: prosedur restore terbukti, bukan hanya diasumsikan.

### 4. Test authorization regresi

- [ ] Therapist unassigned tidak bisa read/write rekam medis.
- [ ] Therapist unassigned tidak bisa melihat/mengekspor intake.
- [ ] Patient tidak bisa membuka dokumen/record pasien lain.
- [ ] Super Admin tanpa clinical permission tidak bisa membuka rekam medis.
- Acceptance: test gagal jika scope assignment dihapus dari query/action.

## Prioritas P1 — sebelum rilis stabil

### 5. Mobile Gate penuh

- [ ] 320 px, 360 px, 390 px, 430 px.
- [ ] 768 px dan 834 px tablet.
- [ ] 1024/1280/1440 px desktop.
- Catatan: 390 px sudah lolos untuk landing, maintenance, dan preview PDF;
      halaman dashboard lain masih perlu matriks penuh.
- Acceptance: tidak ada body-level horizontal scroll dan semua tap target utama
      ≥44 px.

### 6. Halaman dokumen pasien

- [ ] Route `/dashboard/documents` untuk USER.
- [ ] Hanya dokumen `patient_visible` milik pasien sendiri.
- [ ] Unduh melalui endpoint terproteksi + audit.
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

- [ ] Saat viewer PDF diblokir, tampilkan tombol Unduh/Cetak yang jelas tanpa
      iframe kosong.
- Catatan: sudah ada tombol Cetak/Unduh, tetapi fallback visual untuk viewer
      yang diblokir masih bisa diperbaiki.

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
