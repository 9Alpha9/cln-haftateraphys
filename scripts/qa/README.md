# QA report generator

`scripts/qa` berisi naskah temuan audit (`qa-report-data.ts`), generator HTML
(`generate-qa-report-html.ts`), dan seed rekam medis dummy untuk QA.

## Generate laporan PDF

```bash
./node_modules/.bin/tsx scripts/qa/generate-qa-report-html.ts
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files \
  --print-to-pdf=artifacts/qa/qa-report-hafta-2026-11-16.pdf \
  file://$PWD/artifacts/qa/qa-report-hafta-2026-11-16.html
```

Output: `artifacts/qa/qa-report-hafta-<tanggal>.html` dan `.pdf`.

## Seed data QA

```bash
./node_modules/.bin/tsx --env-file-if-exists=.env scripts/qa/seed-qa-medical-record.ts
```

Hanya memakai akun `*.dummy.hafta.test`. Jangan pernah menjalankan terhadap data
pasien nyata. Screenshot dan PDF contoh diletakkan di `artifacts/qa/`.
