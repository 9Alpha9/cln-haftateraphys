# QA report generator

`scripts/qa` berisi naskah temuan audit (`qa-report-data.ts`), generator HTML
(`generate-qa-report-html.ts`), dan seed rekam medis dummy untuk QA.

## Generate laporan PDF (render dua-pass)

Chrome tidak mendukung `target-counter(attr(href), page)`, sehingga nomor halaman
daftar isi dihitung lewat dua pass: render awal → ekstrak posisi bab dengan
`pdf-parse` → render ulang dengan `QA_TOC_PAGES`.

```bash
# Pass 1 — render awal (TOC tanpa nomor)
./node_modules/.bin/tsx scripts/qa/generate-qa-report-html.ts
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files \
  --print-to-pdf=/tmp/qa-pass1.pdf \
  file://$PWD/artifacts/qa/qa-report-hafta-<tanggal>.html

# Ekstrak nomor halaman per bab (butuh pdf-parse, contoh di /tmp/pdftest)
node /tmp/pdftest/extract-toc.js   # mengeluarkan QA_TOC_PAGES={...}

# Pass 2 — render final dengan nomor TOC
QA_TOC_PAGES='{"bab-1":3,...}' ./node_modules/.bin/tsx scripts/qa/generate-qa-report-html.ts
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files \
  --print-to-pdf=artifacts/qa/qa-report-hafta-<tanggal>.pdf \
  file://$PWD/artifacts/qa/qa-report-hafta-<tanggal>.html
```

Output: `artifacts/qa/qa-report-hafta-<tanggal>.html` dan `.pdf` (55 halaman, 12 bab).

## Seed data QA

```bash
./node_modules/.bin/tsx --env-file-if-exists=.env scripts/qa/seed-qa-medical-record.ts
```

Hanya memakai akun `*.dummy.hafta.test`. Jangan pernah menjalankan terhadap data
pasien nyata. Screenshot dan PDF contoh diletakkan di `artifacts/qa/`.
