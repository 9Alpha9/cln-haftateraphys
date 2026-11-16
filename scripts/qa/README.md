# QA report generator

`scripts/qa` berisi naskah temuan audit (`qa-report-data.ts`) dan generator laporan PDF
(`generate-qa-report-pdf.tsx`).

Jalankan dari root proyek:

```bash
./node_modules/.bin/tsx scripts/qa/generate-qa-report-pdf.tsx
```

Output: `artifacts/qa/qa-report-hafta-<YYYY-MM-DD>.pdf`.

Naskah temuan wajib memakai data dummy/de-identified dan tidak memuat data pasien nyata.
