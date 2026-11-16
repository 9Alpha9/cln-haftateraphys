/**
 * Generator laporan QA berbasis HTML (lalu dicetak ke PDF dengan Chrome).
 *
 * Jalankan:
 *   ./node_modules/.bin/tsx scripts/qa/generate-qa-report-html.ts
 *
 * Output: artifacts/qa/qa-report-hafta-YYYY-MM-DD.html
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { QA_REPORT, type QaFinding } from './qa-report-data';

const SEVERITY_CLASS: Record<QaFinding['severity'], string> = {
  Blocker: 'sev-blocker',
  Critical: 'sev-critical',
  High: 'sev-high',
  Medium: 'sev-medium',
  Low: 'sev-low',
  Info: 'sev-info',
};

const STATUS_CLASS: Record<QaFinding['status'], string> = {
  Fixed: 'status-fixed',
  Open: 'status-open',
  Deferred: 'status-deferred',
  Accepted: 'status-accepted',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(join(process.cwd(), 'artifacts/qa/screenshots', file), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function findingCard(finding: QaFinding, hasImage: boolean): string {
  return `
  <section class="finding">
    <div class="finding-head">
      <div>
        <div class="finding-kicker">${escapeHtml(finding.id)} · ${escapeHtml(finding.category)} · ${escapeHtml(finding.area)}</div>
        <h3>${escapeHtml(finding.title)}</h3>
        ${finding.route ? `<p class="route">${escapeHtml(finding.route)}</p>` : ''}
      </div>
      <div class="chips">
        <span class="chip ${SEVERITY_CLASS[finding.severity]}">${escapeHtml(finding.severity)}</span>
        <span class="chip ${STATUS_CLASS[finding.status]}">${escapeHtml(finding.status)}</span>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="label">Bukti</div>
        <p>${escapeHtml(finding.evidence)}</p>
      </div>
      <div>
        <div class="label">Kode / klasifikasi</div>
        <p class="mono">${escapeHtml(finding.errorCode ?? '-')}</p>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="label">Expected</div>
        <p>${escapeHtml(finding.expected)}</p>
      </div>
      <div>
        <div class="label">Actual</div>
        <p>${escapeHtml(finding.actual)}</p>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="label">Langkah reproduksi</div>
        <ol>${finding.reproduction.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      </div>
      <div>
        <div class="label">Rekomendasi</div>
        <p>${escapeHtml(finding.recommendation)}</p>
      </div>
    </div>

    ${
      finding.evidenceImage && hasImage
        ? `<figure>
            <img src="screenshots/${escapeHtml(finding.evidenceImage)}" alt="Bukti ${escapeHtml(finding.id)}" />
            <figcaption>${escapeHtml(finding.evidenceImage)} — anotasi merah menunjukkan area masalah, hijau menunjukkan hasil perbaikan.</figcaption>
          </figure>`
        : ''
    }
  </section>`;
}

async function main() {
  const imageCache = new Map<string, boolean>();
  for (const finding of QA_REPORT.findings) {
    if (finding.evidenceImage) {
      imageCache.set(finding.evidenceImage, await exists(finding.evidenceImage));
    }
  }

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(QA_REPORT.title)} — ${escapeHtml(QA_REPORT.subtitle)}</title>
<style>
  @page { size: A4; margin: 17mm 14mm 16mm 14mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0; color: #1c1917; background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif;
    font-size: 10.2pt; line-height: 1.45;
  }
  .cover { height: 252mm; display: flex; flex-direction: column; page-break-after: always; }
  .brand-band { height: 5mm; width: 100%; background: #FFD093; margin-bottom: 14mm; }
  .brand { font-size: 11pt; font-weight: 800; letter-spacing: .02em; }
  .doc-type { font-size: 7.5pt; letter-spacing: .18em; color: #78716c; margin-top: 1mm; }
  h1.cover-title { font-size: 31pt; line-height: 1.1; margin: 24mm 0 4mm; letter-spacing: -.02em; }
  .cover-subtitle { font-size: 13pt; color: #57534e; }
  .cover-rule { width: 30mm; height: 1.2mm; background: #FFD093; margin: 8mm 0; }
  .cover-meta { display: grid; grid-template-columns: 38mm 1fr; gap: 2mm 4mm; font-size: 9.5pt; margin-top: 6mm; }
  .cover-meta dt { color: #78716c; }
  .cover-meta dd { margin: 0; color: #292524; }
  .cover-summary { margin-top: 12mm; padding: 6mm; background: #FAFAF8; border: 1px solid #e7e5e4; }
  .cover-summary h2 { margin-top: 0; }
  .cover-bottom { margin-top: auto; font-size: 8pt; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 3mm; }
  h1.section { font-size: 17pt; margin: 0 0 4mm; letter-spacing: -.01em; }
  h2 { font-size: 12pt; margin: 7mm 0 2.5mm; }
  h3 { font-size: 11.2pt; margin: 0 0 1mm; line-height: 1.25; }
  p { margin: 0 0 2mm; }
  .page-break { page-break-before: always; }
  .lead { color: #57534e; margin-bottom: 5mm; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; margin: 4mm 0 6mm; }
  .summary-card { border: 1px solid #e7e5e4; padding: 3.5mm; background: #fff; }
  .summary-card .k { color: #78716c; font-size: 7.5pt; }
  .summary-card .v { font-size: 18pt; font-weight: 800; margin-top: 1mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
  th, td { border: 1px solid #e7e5e4; padding: 2mm 2.2mm; text-align: left; vertical-align: top; font-size: 8.2pt; }
  th { background: #f5f5f4; font-size: 7.8pt; }
  tr { page-break-inside: avoid; }
  .finding { border: 1px solid #e7e5e4; border-left: 3px solid #FFD093; padding: 4mm; margin-bottom: 4mm; page-break-inside: avoid; background: #fff; }
  .finding-head { display: flex; justify-content: space-between; gap: 4mm; align-items: flex-start; }
  .finding-kicker { color: #78716c; font-size: 7.5pt; font-weight: 700; letter-spacing: .02em; margin-bottom: 1mm; }
  .route { color: #57534e; font-size: 8pt; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .chips { display: flex; flex-direction: column; gap: 1.2mm; align-items: flex-end; }
  .chip { display: inline-block; padding: 1mm 2mm; font-size: 7pt; font-weight: 800; letter-spacing: .02em; border: 1px solid currentColor; }
  .sev-blocker, .sev-critical { color: #7f1d1d; background: #fef2f2; }
  .sev-high { color: #b91c1c; background: #fef2f2; }
  .sev-medium { color: #b45309; background: #fffbeb; }
  .sev-low, .sev-info { color: #0d766e; background: #ecfdf5; }
  .status-fixed { color: #065f46; background: #d1fae5; }
  .status-open { color: #9a3412; background: #ffedd5; }
  .status-deferred, .status-accepted { color: #57534e; background: #f5f5f4; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 2.5mm; }
  .label { font-size: 7.2pt; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #78716c; margin-bottom: .8mm; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.5pt; }
  ol { margin: 0; padding-left: 5mm; }
  li { margin-bottom: .8mm; }
  figure { margin: 3mm 0 0; }
  figure img { width: 100%; max-height: 78mm; object-fit: contain; border: 1px solid #e7e5e4; }
  figcaption { color: #a8a29e; font-size: 7pt; margin-top: 1mm; }
  ul.clean { margin: 0 0 3mm; padding-left: 5mm; }
  ul.clean li { margin-bottom: 1mm; }
  .note { background: #FAFAF8; border-left: 3px solid #FFD093; padding: 3mm 4mm; margin: 4mm 0; }
  .signatures { display: flex; justify-content: space-between; margin-top: 18mm; }
  .signatures div { font-size: 9pt; }
  .signatures .line { margin-top: 16mm; border-top: 1px solid #d6d3d1; padding-top: 1mm; min-width: 55mm; }
  .footer { color: #a8a29e; font-size: 7.5pt; }
</style>
</head>
<body>
  <section class="cover">
    <div class="brand-band"></div>
    <div class="brand">HAFTA FISIOTERAPI</div>
    <div class="doc-type">QUALITY ASSURANCE · SECURITY · UX AUDIT</div>
    <h1 class="cover-title">${escapeHtml(QA_REPORT.title)}</h1>
    <div class="cover-subtitle">${escapeHtml(QA_REPORT.subtitle)}</div>
    <div class="cover-rule"></div>
    <dl class="cover-meta">
      <dt>Versi laporan</dt><dd>${escapeHtml(QA_REPORT.version)}</dd>
      <dt>Tanggal audit</dt><dd>${escapeHtml(QA_REPORT.date)}</dd>
      <dt>Lingkup</dt><dd>${QA_REPORT.scope.length} area utama: publik, autentikasi, pasien, staf/terapis, admin, PDF, error, maintenance</dd>
      <dt>Metode</dt><dd>Static review, authorization matrix, browser walkthrough, Lighthouse, PDF byte/text inspection, build &amp; test gate</dd>
      <dt>Data</dt><dd>Dummy / de-identified — tidak ada data pasien nyata</dd>
    </dl>
    <div class="cover-summary">
      <h2>Ringkasan eksekutif</h2>
      <p>Audit menemukan <strong>1 critical</strong> dan <strong>8 high</strong> pada otorisasi klinis, alur cetak/PDF, dan pengalaman error. Sebanyak <strong>22 temuan diperbaiki</strong> dan diverifikasi ulang. Aplikasi lulus typecheck, ESLint tanpa error, 34 test otomatis, dan build produksi. Landing page serta dashboard pasien mencapai Accessibility Lighthouse <strong>1.00</strong> setelah perbaikan kontras dan ARIA.</p>
      <p>Staging dapat dilanjutkan setelah rate limiting, CSP, dan Mobile Gate ditutup. Produksi memerlukan review retensi rekam medis, backup/restore, dan monitoring insiden.</p>
    </div>
    <div class="cover-bottom">Dokumen ini tidak memuat data pasien nyata dan tidak boleh digunakan sebagai bukti klinis.</div>
  </section>

  <section class="page-break">
    <h1 class="section">1. Lingkup, metode, dan matriks fitur</h1>
    <h2>1.1 Lingkup audit</h2>
    <ul class="clean">${QA_REPORT.scope.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h2>1.2 Environment</h2>
    <table><tbody>${QA_REPORT.environment.map((item) => `<tr><th style="width:30%">${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`).join('')}</tbody></table>
    <h2>1.3 Matriks fitur per area</h2>
    <table>
      <thead><tr><th style="width:19%">Area</th><th style="width:27%">Route</th><th style="width:11%">Status</th><th>Catatan</th></tr></thead>
      <tbody>${QA_REPORT.features.map((feature) => `<tr><td>${escapeHtml(feature.area)}</td><td class="mono">${escapeHtml(feature.route)}</td><td>${escapeHtml(feature.status)}</td><td>${escapeHtml(feature.notes)}</td></tr>`).join('')}</tbody>
    </table>
    <h2>1.4 Hasil positif</h2>
    <ul class="clean">${QA_REPORT.positives.map((item) => `<li>✓ ${escapeHtml(item)}</li>`).join('')}</ul>
  </section>

  <section class="page-break">
    <h1 class="section">2. Daftar temuan</h1>
    <p class="lead">Severity mengikuti dampak terhadap keamanan data pasien, integritas rekam medis, dan kemampuan pengguna menyelesaikan tugas utama.</p>
    <div class="summary-grid">
      ${QA_REPORT.summary.map((item) => `<div class="summary-card"><div class="k">${escapeHtml(item.label)}</div><div class="v">${escapeHtml(item.value)}</div></div>`).join('')}
    </div>
    <table>
      <thead><tr><th style="width:10%">ID</th><th>Judul</th><th style="width:11%">Severity</th><th style="width:10%">Status</th><th style="width:13%">Kategori</th></tr></thead>
      <tbody>${QA_REPORT.findings
        .map(
          (finding) =>
            `<tr><td class="mono">${escapeHtml(finding.id.replace('QA-', ''))}</td><td>${escapeHtml(finding.title)}</td><td><span class="chip ${SEVERITY_CLASS[finding.severity]}">${escapeHtml(finding.severity)}</span></td><td>${escapeHtml(finding.status)}</td><td>${escapeHtml(finding.category)}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
    <h2>2.1 Metodologi pengujian</h2>
    <div class="note">
      <strong>Quality gate yang dijalankan:</strong> <span class="mono">tsc --noEmit</span>, <span class="mono">eslint .</span>, <span class="mono">vitest run</span> (34 test), <span class="mono">next build</span>, Lighthouse, serta walkthrough browser pada akun dummy pasien, terapis, dan Super Admin. Setiap temuan keamanan diperiksa pada jalur server, bukan hanya UI.
    </div>
  </section>

  <section class="page-break">
    <h1 class="section">3. Detail temuan dan bukti</h1>
    ${QA_REPORT.findings.map((finding) => findingCard(finding, Boolean(finding.evidenceImage && imageCache.get(finding.evidenceImage)))).join('')}
  </section>

  <section class="page-break">
    <h1 class="section">4. Catatan akhir dan rekomendasi</h1>
    <h2>4.1 Catatan pengujian</h2>
    <ul class="clean">${QA_REPORT.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
    <h2>4.2 Rekomendasi rilis</h2>
    <div class="note">${escapeHtml(QA_REPORT.recommendation)}</div>
    <h2>4.3 Saran pengembangan berikutnya</h2>
    <ol>
      <li>Tutup rate limiting login/reset dan terapkan CSP di staging sebelum produksi.</li>
      <li>Jalankan Mobile Gate penuh 320/360/390/430 px dan simpan screenshot per breakpoint.</li>
      <li>Tambahkan halaman dokumen pasien (patient-visible) dan detail pengguna Super Admin.</li>
      <li>Satukan keputusan visual (palet oranye Hafta + Inter vs dokumen emerald + Poppins) agar design system tidak drift.</li>
      <li>Tambahkan monitoring error produksi (Sentry/OpenTelemetry) dengan redaksi data klinis.</li>
      <li>Tambahkan test authorization otomatis untuk therapist-unassigned dan intake IDOR setiap rilis.</li>
    </ol>

    <h2>Lampiran</h2>
    <ul class="clean">
      <li><span class="mono">artifacts/qa/medical-record-sample.pdf</span> — contoh PDF rekam medis 3 halaman (2 isi + lembar pengesahan).</li>
      <li><span class="mono">artifacts/qa/screenshots/</span> — screenshot sumber dan hasil anotasi.</li>
      <li><span class="mono">scripts/qa/qa-report-data.ts</span> — naskah temuan yang dapat diperbarui.</li>
    </ul>

    <div class="signatures">
      <div>
        <div>Disusun oleh,</div>
        <div class="line"><strong>QA Engineering</strong><br /><span class="footer">Hafta Fisioterapi · ${escapeHtml(QA_REPORT.date)}</span></div>
      </div>
      <div>
        <div>Disetujui oleh,</div>
        <div class="line"><strong>Project Owner</strong><br /><span class="footer">Nama &amp; tanggal: ____________________</span></div>
      </div>
    </div>
  </section>
</body>
</html>`;

  const outDir = join(process.cwd(), 'artifacts/qa');
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, `qa-report-hafta-${new Date().toISOString().slice(0, 10)}.html`);
  await writeFile(file, html);
  console.log(`QA HTML written: ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
