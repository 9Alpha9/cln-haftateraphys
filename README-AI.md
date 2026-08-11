# README-AI — Hafta Fisioterapi

Dokumen ini adalah entry point untuk manusia dan AI coding agent.

## Tujuan paket

Paket ini mendefinisikan product requirement, arsitektur, database, permission, security, UI rules, dan workflow development Hafta Fisioterapi sebelum implementasi utama dimulai.

Format sengaja menggunakan Markdown UTF-8 dan JSON agar mudah diproses oleh AI agent, editor, CLI agent, GitHub, dan tooling dokumentasi biasa.

## AI bootstrap

Saat agent baru mulai session:

1. Baca `AGENTS.md`.
2. Baca `docs/MASTER-PRD.md`.
3. Baca task-specific specification di `docs/pages/` bila task menyentuh halaman/role tertentu.
4. Jika task menyentuh UI, baca `docs/DESIGN-REFERENCES.md`, `docs/DESIGN-SYSTEM.md`, dan `docs/MOBILE-FIRST-STRATEGY.md`.
5. Baca dokumen domain yang berkaitan dengan task.
6. Periksa existing code sebelum membuat file baru.
7. Untuk UI: selesaikan Mobile Gate sebelum menambahkan desktop enhancement.
8. Buat implementasi sekecil mungkin yang memenuhi requirement.
9. Jalankan validation gates sesuai `docs/DEVELOPMENT-WORKFLOW.md`.

## Dokumen

- `START-DEVELOPMENT.md` — prompt awal dan urutan eksekusi development.
- `docs/MASTER-PRD.md` — product requirements utama.
- `docs/ARCHITECTURE.md` — arsitektur aplikasi dan folder.
- `docs/DATABASE.md` — model data dan persistence rules.
- `docs/PERMISSIONS.md` — RBAC + object-level authorization.
- `docs/SECURITY.md` — security baseline untuk aplikasi data kesehatan.
- `docs/DESIGN-REFERENCES.md` — visual references dan aturan penggunaannya.
- `docs/DESIGN-SYSTEM.md` — canonical visual tokens/components.
- `docs/MOBILE-FIRST-STRATEGY.md` — urutan implementasi mobile → desktop dan responsive gates.
- `docs/UI-GUIDELINES.md` — sistem UI/UX dan Taste Skill guardrails.
- `docs/DEVELOPMENT-WORKFLOW.md` — urutan implementasi dan quality gates.
- `docs/FORM-SPECIFICATIONS.md` — field/form contract untuk patient dan clinical workflow.
- `docs/ROUTE-AND-NAVIGATION.md` — route matrix dan navigation authorization.
- `docs/pages/01-LANDING-PAGE.md` — detail landing page.
- `docs/pages/02-AUTHENTICATION-PAGES.md` — login/register/recovery/verification.
- `docs/pages/03-DASHBOARD-USER.md` — Patient Portal USER.
- `docs/pages/04-DASHBOARD-ADMIN-THERAPIST.md` — workflow ADMIN/Therapist.
- `docs/pages/05-DASHBOARD-SUPER-ADMIN.md` — governance SUPER_ADMIN.
- `docs/CONTENT-REQUIREMENTS.md` — data yang masih harus dikumpulkan dari Hafta.
- `manifest.json` — machine-readable document manifest.

## Important classification

Aplikasi menangani data pasien dan informasi kesehatan. Anggap seluruh clinical data sebagai sensitive data. Gunakan dummy data selama development kecuali ada environment terkontrol dan kebijakan penggunaan data yang sudah disetujui.

## 9Router role

9Router adalah development-time AI gateway/router. 9Router tidak termasuk production request path aplikasi pasien dan tidak boleh menerima patient data production.

## Change policy

Jika requirement berubah:

1. update PRD terlebih dahulu;
2. update permission/database/security docs bila terdampak;
3. baru ubah implementasi;
4. catat breaking change.


## Execution tasks

Folder `tasks/` berisi task implementation-ready yang dapat diberikan langsung ke coding agent setelah canonical docs dibaca. Mulai dari `tasks/README.md`, lalu ikuti dependency/task order. Task files tidak boleh mengoverride security, permission, database, atau Master PRD.
