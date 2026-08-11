# AI Agent Execution Tasks

Task files di folder ini mengubah PRD menjadi unit implementasi yang bisa diberikan langsung ke coding agent.

## Rules

1. Selalu baca `AGENTS.md` terlebih dahulu.
2. Task file tidak menggantikan security/permission/database docs.
3. Jangan mengerjakan task berikutnya sebelum exit criteria task aktif terpenuhi, kecuali manusia secara eksplisit meminta parallel work.
4. Gunakan dummy/de-identified data saja.
5. Jika requirement task bertentangan dengan canonical docs, hentikan asumsi dan ikuti canonical precedence pada `AGENTS.md`.
6. Untuk task UI, mobile/base implementation harus lulus Mobile Gate sebelum desktop enhancement dimulai.
7. Untuk task UI, gunakan `docs/DESIGN-SYSTEM.md` dan `docs/DESIGN-REFERENCES.md`; jangan meniru reference layout 1:1.

## Order

1. `00-PROJECT-BOOTSTRAP.md`
2. `01-DESIGN-FOUNDATION.md`
3. `02-LANDING-PAGE.md`
4. `03-AUTH-AND-DATABASE.md`
5. `04-PERMISSION-FRAMEWORK.md`
6. `05-USER-PATIENT-PORTAL.md`
7. `06-ADMIN-THERAPIST-CLINICAL.md`
8. `07-SUPER-ADMIN.md`
9. `08-SECURITY-HARDENING.md`

Each task contains read-first files, scope, forbidden changes, tests, and done criteria.
