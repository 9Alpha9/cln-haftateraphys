# AGENTS.md — Hafta Fisioterapi

> Status: NON-NEGOTIABLE AI AGENT INSTRUCTIONS
> Version: 0.3.0
> Last updated: 2026-08-12
> Language: Indonesian

## 1. Mission

Anda adalah coding agent yang mengerjakan aplikasi Hafta Fisioterapi. Implementasi harus mengikuti dokumen proyek di repository ini. Jangan mengarang requirement baru ketika requirement sudah didefinisikan.

## 2. Mandatory read order

Sebelum menulis atau mengubah kode, baca file berikut sesuai urutan:

1. `README-AI.md`
2. `docs/MASTER-PRD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE.md`
5. `docs/PERMISSIONS.md`
6. `docs/SECURITY.md`
7. `docs/DESIGN-REFERENCES.md`
8. `docs/DESIGN-SYSTEM.md`
9. `docs/MOBILE-FIRST-STRATEGY.md`
10. `docs/UI-GUIDELINES.md`
11. `docs/DEVELOPMENT-WORKFLOW.md`
12. `docs/FORM-SPECIFICATIONS.md`
13. `docs/ROUTE-AND-NAVIGATION.md`
14. task-specific page spec under `docs/pages/`
15. `docs/CONTENT-REQUIREMENTS.md`

Jika context window terbatas, baca minimal: `AGENTS.md`, bagian feature pada `MASTER-PRD.md`, task-specific page spec di `docs/pages/`, lalu dokumen security/permission/database yang terdampak.

Jika bekerja dari file `tasks/*.md`, baca task tersebut setelah canonical docs yang tercantum pada bagian `Read first`. Task file adalah execution unit, bukan policy override.

## 3. Source-of-truth precedence

Jika ada konflik, gunakan urutan prioritas berikut:

1. `AGENTS.md`
2. `docs/SECURITY.md`
3. `docs/PERMISSIONS.md`
4. `docs/DATABASE.md`
5. `docs/MASTER-PRD.md`
6. Task-specific specification under `docs/pages/` / `docs/FORM-SPECIFICATIONS.md`
7. `docs/ARCHITECTURE.md`
8. `docs/DESIGN-SYSTEM.md`
9. `docs/MOBILE-FIRST-STRATEGY.md`
10. `docs/DESIGN-REFERENCES.md`
11. `docs/UI-GUIDELINES.md`
12. Existing code that has already passed review

Jangan menurunkan security demi mengikuti UI atau kemudahan implementasi.

## 4. Locked technology direction

- Next.js latest stable, App Router.
- TypeScript strict.
- Tailwind CSS.
- shadcn/ui.
- Taste Skill sebagai design-quality guardrail.
- React Hook Form + Zod untuk form kompleks.
- Neon PostgreSQL.
- Drizzle ORM.
- Better Auth atau integration layer yang ditetapkan proyek untuk authentication.
- Cloudflare R2 untuk private file storage bila upload dokumen diaktifkan.
- pnpm.
- 9Router hanya merupakan AI routing layer pada workflow development, bukan komponen production aplikasi pasien.

Jangan mengganti framework, ORM, database, auth architecture, atau package manager tanpa keputusan eksplisit dari pemilik proyek.

## 4A. Mobile-first UI rule

All UI development is mobile-first. Base markup/styles MUST be implemented and validated on mobile before tablet/desktop enhancement. Read `docs/MOBILE-FIRST-STRATEGY.md`.

For UI tasks:

```text
Mobile implementation -> Mobile Gate -> Tablet/Desktop enhancement -> Desktop Gate -> Cross-breakpoint QA
```

AI agents MUST NOT start from the desktop mockup and compress it into mobile. The visual reference is a composition guide; the implementation order remains mobile-first.

Canonical visual direction is defined by `docs/DESIGN-SYSTEM.md` and `docs/DESIGN-REFERENCES.md`.

## 5. Folder rules

- Gunakan `app/.../...` untuk route dan composition.
- Semua reusable UI component berada di `components/`.
- Pisahkan komponen berdasarkan domain/feature.
- Business logic server berada di `server/`.
- Database berada di `db/`.
- Authorization dan security utilities berada di `lib/permissions` dan `lib/security`.
- Validation schema berada di `lib/validators` atau dekat domain jika benar-benar feature-specific.
- Jangan membuat `page.tsx` atau component raksasa yang memuat seluruh logic feature.
- Jangan membuat duplicate component jika komponen yang sesuai sudah ada.

## 6. Coding rules

MUST:

- TypeScript strict dan tanpa `any` kecuali alasan tertulis sangat kuat.
- Gunakan descriptive naming.
- Validate semua untrusted input di server.
- Authorization dilakukan server-side pada setiap operasi sensitif.
- Query hanya mengambil data minimum yang diperlukan.
- Gunakan transaction untuk operasi multi-record yang harus atomik.
- Audit operasi sensitif.
- Gunakan soft archive/versioning untuk data klinis; jangan hard-delete rekam klinis.
- Tangani loading, empty, error, unauthorized, forbidden states.
- Tambahkan tests untuk authorization dan business rule kritis.

MUST NOT:

- Menyimpan role atau authorization source-of-truth di `localStorage`.
- Mengandalkan hide/show UI sebagai security.
- Mengekspos database secret, auth secret, storage secret, atau service token ke client bundle.
- Mengirim data pasien nyata ke AI provider, 9Router, logging eksternal, analytics, atau prompt coding agent.
- Menaruh query database langsung di presentational client component.
- Menggunakan hard delete untuk assessment, treatment plan, therapy session, progress note, consent, atau audit log.
- Mengubah database schema tanpa migration.
- Mengabaikan lint/typecheck/tests agar build lolos.

## 7. AI-specific safety

Semua sample data yang digunakan agent harus dummy atau de-identified.

Dilarang memasukkan ke prompt AI:

- nama pasien nyata;
- tanggal lahir pasien;
- nomor telepon;
- alamat;
- diagnosis/keluhan yang dapat dihubungkan ke individu;
- foto pasien;
- dokumen medis;
- session cookie/token;
- environment secrets;
- database dump production.

9Router boleh merutekan permintaan coding, tetapi tidak boleh dijadikan jalur pemrosesan data pasien production.

## 8. Before implementing a feature

Agent wajib menyebut secara internal/commit notes:

- requirement ID yang sedang dikerjakan;
- route yang terdampak;
- tabel yang terdampak;
- permission yang dibutuhkan;
- validation yang dibutuhkan;
- audit event yang dibutuhkan;
- test yang dibutuhkan.

## 9. Definition of done

Feature belum selesai jika salah satu berikut belum terpenuhi:

- requirement terpenuhi;
- Mobile Gate lulus sebelum desktop enhancement;
- Desktop Gate dan cross-breakpoint QA lulus;
- UI responsive dan accessible;
- server-side validation ada;
- server-side authorization ada;
- audit event ada bila diperlukan;
- database migration aman bila schema berubah;
- lint lulus;
- typecheck lulus;
- tests kritis lulus;
- tidak ada secret/data pasien dalam log;
- dokumentasi di-update jika kontrak feature berubah.
