/**
 * Generator laporan QA & Pentest v2.0 (HTML → PDF via Chrome headless).
 *
 * Jalankan:
 *   ./node_modules/.bin/tsx scripts/qa/generate-qa-report-html.ts
 *
 * Opsi (environment):
 *   QA_TOC_PAGES='{"bab-3":5,...}'   nomor halaman hasil render pass-1 (two-pass TOC)
 *
 * Output: artifacts/qa/qa-report-hafta-YYYY-MM-DD.html
 */
import { writeFile, mkdir, access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { QA_REPORT, type QaFinding, type QaStatus } from './qa-report-data';

const SEVERITY_CLASS: Record<QaFinding['severity'], string> = {
  Blocker: 'sev-blocker',
  Critical: 'sev-critical',
  High: 'sev-high',
  Medium: 'sev-medium',
  Low: 'sev-low',
  Info: 'sev-info',
};

const STATUS_CLASS: Record<QaStatus, string> = {
  Fixed: 'status-fixed',
  Open: 'status-open',
  Verified: 'status-verified',
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
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function renderList(items: string[], cls = 'rep'): string {
  return `<ul class="${cls}">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function renderFinding(finding: QaFinding, imageAvailable: boolean): string {
  const statusChip = `<span class="chip ${STATUS_CLASS[finding.status]}">${escapeHtml(finding.status)}</span>`;
  const v1Chip = `<span class="chip ${finding.v1Status === 'Baru' ? 'status-new' : 'status-v1'}">v1.0: ${escapeHtml(finding.v1Status)}</span>`;
  const arrow = finding.v1Status === 'Baru' ? '' : `<span class="arrow">${escapeHtml(finding.v1Status)} → ${escapeHtml(finding.status)}</span>`;
  return `<section class="finding" id="finding-${escapeHtml(finding.id)}">
    <div class="finding-head">
      <span class="fid">${escapeHtml(finding.id)}</span>
      <span class="chip ${SEVERITY_CLASS[finding.severity]}">${escapeHtml(finding.severity)}</span>
      <span class="chip cat">${escapeHtml(finding.category)}</span>
      <span class="chip phase">Fase ${escapeHtml(finding.phase)}</span>
      ${statusChip}${v1Chip}${arrow}
    </div>
    <h3>${escapeHtml(finding.title)}</h3>
    <table class="kv">
      <tr><th>Lokasi</th><td>${escapeHtml(finding.area)}${finding.route ? ` · <code>${escapeHtml(finding.route)}</code>` : ''}</td></tr>
      <tr><th>Bukti</th><td>${escapeHtml(finding.evidence)}</td></tr>
      ${finding.errorCode ? `<tr><th>Referensi</th><td>${escapeHtml(finding.errorCode)}</td></tr>` : ''}
      <tr><th>Diharapkan</th><td>${escapeHtml(finding.expected)}</td></tr>
      <tr><th>Aktual</th><td>${escapeHtml(finding.actual)}</td></tr>
    </table>
    <p class="lbl">Langkah reproduksi</p>
    ${renderList(finding.reproduction, 'rep num')}
    <div class="ts-box">
      <p class="lbl">Troubleshooting &amp; langkah penanganan</p>
      <p>${escapeHtml(finding.troubleshooting)}</p>
    </div>
    <p class="lbl">Rekomendasi</p>
    <p class="rec">${escapeHtml(finding.recommendation)}</p>
    ${
      finding.evidenceImage && imageAvailable
        ? `<figure><img src="${escapeHtml(finding.evidenceImage)}" alt="Bukti ${escapeHtml(finding.id)}" /><figcaption>Bukti: ${escapeHtml(finding.evidenceImage)}</figcaption></figure>`
        : ''
    }
  </section>`;
}

async function main() {
  const imageCache = new Map<string, boolean>();
  for (const finding of QA_REPORT.findings) {
    if (finding.evidenceImage) {
      imageCache.set(finding.evidenceImage, await exists(join('artifacts/qa', finding.evidenceImage)));
    }
  }

  // Nomor halaman TOC (dua-pass). Kosong pada render pertama.
  let tocPages: Record<string, number> = {};
  if (process.env.QA_TOC_PAGES) {
    try {
      tocPages = JSON.parse(process.env.QA_TOC_PAGES) as Record<string, number>;
    } catch {
      console.warn('[warn] QA_TOC_PAGES tidak valid — TOC tanpa nomor halaman.');
    }
  }

  // Ringkasan dihitung dari findings.
  const count = (pred: (f: QaFinding) => boolean) => QA_REPORT.findings.filter(pred).length;
  const bySeverity = (s: QaFinding['severity']) => count((f) => f.severity === s);
  const summary: Array<{ label: string; value: string }> = [
    { label: 'Total temuan', value: String(QA_REPORT.findings.length) },
    { label: 'Temuan baru di v2.0', value: String(count((f) => f.v1Status === 'Baru')) },
    { label: 'Temuan v1.0 diverifikasi ulang', value: String(count((f) => f.v1Status !== 'Baru')) },
    { label: 'Status Open', value: String(count((f) => f.status === 'Open')) },
    { label: 'Status Verified', value: String(count((f) => f.status === 'Verified')) },
    { label: 'Blocker / Critical', value: `${bySeverity('Blocker')} / ${bySeverity('Critical')}` },
    { label: 'High', value: String(bySeverity('High')) },
    { label: 'Medium', value: String(bySeverity('Medium')) },
    { label: 'Low / Info', value: `${bySeverity('Low')} / ${bySeverity('Info')}` },
    { label: 'Harness regresi baru', value: '42 test (25 otorisasi + 17 injeksi)' },
    { label: 'Total test otomatis', value: '86 — seluruhnya lulus' },
    { label: 'Fase audit selesai', value: `${QA_REPORT.phases.filter((p) => p.status === 'Selesai').length}/${QA_REPORT.phases.length}` },
  ];

  // Logo cover (base64 agar aman di file://).
  const logoPath = 'artifacts/qa/assets/bagian-corps-logo-600.png';
  let logoDataUrl = '';
  if (await exists(logoPath)) {
    const buf = await readFile(logoPath);
    logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  }

  const tocHtml = QA_REPORT.toc
    .map((t) => {
      const page = tocPages[t.id];
      return `<a class="toc-link" href="#${escapeHtml(t.id)}"><span class="toc-title">${escapeHtml(t.title)}</span><span class="toc-dots"></span><span class="toc-page">${page ? String(page) : ''}</span></a>`;
    })
    .join('\n');

  const phaseRows = QA_REPORT.phases
    .map(
      (p) =>
        `<tr><td><strong>${escapeHtml(p.id)}</strong></td><td>${escapeHtml(p.name)}</td><td><span class="chip status-verified">${escapeHtml(p.status)}</span></td><td>${escapeHtml(p.evidence)}</td></tr>`,
    )
    .join('\n');

  const measurementTables = QA_REPORT.measurements
    .map(
      (g) => `<h3 class="mgroup">${escapeHtml(g.group)}</h3>
      <table class="grid">
        <thead><tr><th style="width:34%">Pengukuran</th><th style="width:26%">Hasil</th><th>Penilaian</th></tr></thead>
        <tbody>${g.rows
          .map((r) => {
            const fail = /GAGAL|✗/.test(r.verdict);
            const pass = /Lulus|Sesuai|terverifikasi/.test(r.verdict) && !fail;
            return `<tr><td>${escapeHtml(r.label)}</td><td><code>${escapeHtml(r.value)}</code></td><td class="${fail ? 'fail' : pass ? 'pass' : ''}">${escapeHtml(r.verdict)}</td></tr>`;
          })
          .join('')}</tbody>
      </table>`,
    )
    .join('\n');

  const featureRows = QA_REPORT.features
    .map(
      (f) =>
        `<tr><td>${escapeHtml(f.area)}</td><td><code>${escapeHtml(f.route)}</code></td><td>${escapeHtml(f.status)}</td><td>${escapeHtml(f.notes)}</td></tr>`,
    )
    .join('\n');

  // Matriks status v1.0 → v2.0 (ringkas, urut id).
  const matrixRows = [...QA_REPORT.findings]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (f) =>
        `<tr><td><a href="#finding-${escapeHtml(f.id)}">${escapeHtml(f.id)}</a></td><td>${escapeHtml(f.title)}</td><td>${escapeHtml(f.severity)}</td><td>${escapeHtml(f.v1Status)}</td><td><span class="chip ${STATUS_CLASS[f.status]}">${escapeHtml(f.status)}</span></td><td>Fase ${escapeHtml(f.phase)}</td></tr>`,
    )
    .join('\n');

  const envRows = QA_REPORT.environment
    .map((e) => `<tr><th>${escapeHtml(e.label)}</th><td>${escapeHtml(e.value)}</td></tr>`)
    .join('\n');

  const scopeHtml = renderList(QA_REPORT.scope, 'rep');
  const positiveHtml = renderList(QA_REPORT.positives, 'rep num');
  const additionalHtml = renderList(QA_REPORT.additionalTests, 'rep num');
  const notesHtml = renderList(QA_REPORT.notes, 'rep');
  const findingsHtml = QA_REPORT.findings.map((f) => renderFinding(f, imageCache.get(f.evidenceImage ?? '') ?? false)).join('\n');

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(QA_REPORT.title)} v${escapeHtml(QA_REPORT.version)} — ${escapeHtml(QA_REPORT.subtitle)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm 15mm 14mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0; color: #1c1917; background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif;
    font-size: 10pt; line-height: 1.45;
  }

  /* ── Cover ── */
  .cover { height: 253mm; display: flex; flex-direction: column; page-break-after: always; }
  .brand-band { height: 5mm; width: 100%; background: #FFD093; margin-bottom: 12mm; }
  .cover-logo { width: 34mm; height: 34mm; border: 1px solid #e7e5e4; border-radius: 4mm; padding: 3mm; background: #fafaf9; margin-bottom: 10mm; }
  .cover-logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .brand { font-size: 11pt; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #FF951C; margin-bottom: 4mm; }
  .cover h1 { font-size: 30pt; line-height: 1.1; margin: 0 0 5mm; color: #1c1917; letter-spacing: -0.02em; }
  .cover .subtitle { font-size: 13pt; color: #57534e; margin: 0 0 10mm; max-width: 145mm; }
  .cover-meta { margin-top: auto; display: grid; grid-template-columns: 42mm 1fr; gap: 2mm 4mm; font-size: 10pt; border-top: 2px solid #FF951C; padding-top: 6mm; }
  .cover-meta .k { color: #78716c; }
  .cover-meta .v { font-weight: 600; }
  .cover-foot { margin-top: 8mm; font-size: 8.5pt; color: #a8a29e; }

  /* ── TOC ── */
  .toc { page-break-after: always; }
  .toc h2 { font-size: 17pt; margin: 0 0 6mm; padding-bottom: 3mm; border-bottom: 2px solid #FF951C; }
  .toc-link { display: flex; align-items: baseline; text-decoration: none; color: #1c1917; font-size: 10.5pt; padding: 2.6mm 0; border-bottom: 1px dotted #d6d3d1; }
  .toc-page { font-variant-numeric: tabular-nums; font-weight: 700; color: #FF951C; min-width: 8mm; text-align: right; }
  .toc-dots { flex: 1; border-bottom: 1px dotted #d6d3d1; margin: 0 2mm; transform: translateY(-1mm); }

  /* ── Struktur bab ── */
  h2.bab { font-size: 16pt; margin: 0 0 5mm; padding-bottom: 2.5mm; border-bottom: 2.5px solid #FF951C; page-break-after: avoid; }
  .chapter { page-break-before: always; }
  h3 { font-size: 11.5pt; margin: 6mm 0 2.5mm; color: #292524; page-break-after: avoid; }
  h3.mgroup { font-size: 10.5pt; margin-top: 5mm; padding: 2mm 3mm; background: #fff7ed; border-left: 3px solid #FF951C; border-radius: 0 2mm 2mm 0; }
  p { margin: 0 0 3mm; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.8pt; background: #f5f5f4; padding: 0 1mm; border-radius: 1mm; word-break: break-all; }

  /* ── Tabel ── */
  table { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; font-size: 9.2pt; }
  th, td { border: 1px solid #e7e5e4; padding: 1.8mm 2.2mm; text-align: left; vertical-align: top; }
  thead th { background: #1c1917; color: #fff; font-weight: 700; font-size: 8.8pt; }
  tbody tr:nth-child(even) { background: #fafaf9; }
  table.kv th { width: 26mm; background: #f5f5f4; color: #44403c; font-weight: 700; font-size: 8.8pt; }
  table.grid td code { background: transparent; padding: 0; }

  /* ── Chip status ── */
  .chip { display: inline-block; font-size: 7.6pt; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.7mm 2.2mm; border-radius: 999px; color: #fff; vertical-align: middle; }
  .sev-blocker { background: #7f1d1d; }
  .sev-critical { background: #b91c1c; }
  .sev-high { background: #ea580c; }
  .sev-medium { background: #ca8a04; }
  .sev-low { background: #2563eb; }
  .sev-info { background: #6b7280; }
  .status-open { background: #dc2626; }
  .status-fixed { background: #16a34a; }
  .status-verified { background: #0d9488; }
  .status-deferred, .status-accepted { background: #6b7280; }
  .status-new { background: #7c3aed; }
  .status-v1 { background: #a8a29e; color: #292524; }
  .chip.cat { background: #44403c; }
  .chip.phase { background: #FF951C; }
  .arrow { font-size: 8.5pt; color: #57534e; font-weight: 700; margin-left: 1.5mm; }

  /* ── Kartu temuan ── */
  .finding { border: 1px solid #e7e5e4; border-radius: 3mm; padding: 4mm; margin: 0 0 5mm; page-break-inside: avoid; }
  .finding-head { display: flex; flex-wrap: wrap; gap: 1.6mm; align-items: center; margin-bottom: 2.5mm; }
  .fid { font-weight: 900; font-size: 10pt; color: #FF951C; letter-spacing: 0.04em; margin-right: 1mm; }
  .finding h3 { margin: 0 0 3mm; font-size: 11.5pt; }
  .lbl { font-weight: 800; font-size: 8.6pt; text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; margin: 3mm 0 1.5mm; }
  ul.rep { margin: 0 0 3mm; padding-left: 5mm; }
  ul.rep li { margin-bottom: 1.2mm; }
  ul.num { list-style: decimal; }
  .ts-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 2mm; padding: 2.5mm 3mm; margin: 1mm 0 2.5mm; page-break-inside: avoid; }
  .ts-box .lbl { margin-top: 0; color: #92400e; }
  .ts-box p { margin: 0; font-size: 9.3pt; }
  .rec { font-weight: 600; color: #292524; background: #f5f5f4; border-left: 3px solid #FF951C; padding: 2mm 3mm; border-radius: 0 2mm 2mm 0; font-size: 9.4pt; }
  figure { margin: 3mm 0 0; page-break-inside: avoid; }
  figure img { max-width: 100%; max-height: 90mm; border: 1px solid #e7e5e4; border-radius: 2mm; }
  figcaption { font-size: 8pt; color: #78716c; margin-top: 1mm; }

  /* ── Ringkasan ── */
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 3mm 0 5mm; }
  .kpi { border: 1px solid #e7e5e4; border-top: 3px solid #FF951C; border-radius: 2mm; padding: 3mm; text-align: center; }
  .kpi .n { font-size: 20pt; font-weight: 900; color: #1c1917; line-height: 1.1; }
  .kpi .t { font-size: 8pt; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1mm; }

  td.pass { color: #15803d; font-weight: 600; }
  td.fail { color: #b91c1c; font-weight: 700; }

  .callout { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 2mm; padding: 3mm; margin: 3mm 0; }
  .callout.warn { background: #fef2f2; border-color: #fecaca; }
  .final { background: #1c1917; color: #f5f5f4; border-radius: 3mm; padding: 5mm; margin-top: 5mm; }
  .final h3 { color: #FF951C; margin-top: 0; }
  .final p { color: #e7e5e4; margin-bottom: 0; }
</style>
</head>
<body>

<!-- ══════════ COVER ══════════ -->
<div class="cover">
  <div class="brand-band"></div>
  ${
    logoDataUrl
      ? `<div class="cover-logo"><img src="${logoDataUrl}" alt="Logo Bagian Corps" /></div>`
      : ''
  }
  <div class="brand">Hafta Fisioterapi</div>
  <h1>${escapeHtml(QA_REPORT.title)}<br /><span style="color:#FF951C">v${escapeHtml(QA_REPORT.version)}</span></h1>
  <p class="subtitle">${escapeHtml(QA_REPORT.subtitle)}</p>
  <div class="cover-meta">
    <div class="k">Tanggal audit</div><div class="v">${escapeHtml(QA_REPORT.date)}</div>
    <div class="k">Sifat audit</div><div class="v">Report-only — tanpa perbaikan kode pada sesi ini</div>
    <div class="k">Lingkup</div><div class="v">Keamanan · Login · Injeksi · UI/UX · Fungsional · Integritas data</div>
    <div class="k">Metode</div><div class="v">8 fase (F1–F8) · 86 test otomatis · probe runtime · Lighthouse &amp; axe-core</div>
    <div class="k">Data uji</div><div class="v">Hanya akun dummy *.dummy.hafta.test (de-identified)</div>
  </div>
  <p class="cover-foot">Dokumen ini berisi temuan audit teknis. Seluruh data yang disebut adalah data dummy; tidak ada data pasien nyata.<br />Disusun dengan dukungan Bagian Corps — bagian.web.id</p>
</div>

<!-- ══════════ DAFTAR ISI ══════════ -->
<nav class="toc">
  <h2>Daftar Isi</h2>
  ${tocHtml}
</nav>

<!-- ══════════ BAB 1 ══════════ -->
<section class="chapter" id="bab-1">
  <h2 class="bab">Bab 1 — Ringkasan eksekutif</h2>
  <p>Laporan <strong>QA &amp; Pentest v2.0</strong> adalah kelanjutan dari laporan v1.0 (16 November 2026) dengan cakupan yang lebih luas: menambahkan pengujian injeksi, probe runtime keamanan (brute force, enumerasi, header, IDOR lintas subjek), pengukuran UI/UX berbasis bukti terukur (Lighthouse, axe-core, matriks viewport), pemetaan seluruh rute, dan audit integritas data/kepatuhan. Seluruh temuan <strong>hanya dilaporkan</strong> — tidak ada perbaikan kode pada sesi ini — dan setiap temuan disertai langkah troubleshooting serta rekomendasi.</p>

  <div class="kpis">
    <div class="kpi"><div class="n">${QA_REPORT.findings.length}</div><div class="t">Total temuan</div></div>
    <div class="kpi"><div class="n">${count((f) => f.v1Status === 'Baru')}</div><div class="t">Baru di v2.0</div></div>
    <div class="kpi"><div class="n">${count((f) => f.status === 'Open')}</div><div class="t">Status Open</div></div>
    <div class="kpi"><div class="n">${count((f) => f.status === 'Verified')}</div><div class="t">Terverifikasi</div></div>
  </div>

  <h3>Ikhtisar angka</h3>
  <table class="grid">
    <thead><tr><th style="width:55%">Metrik</th><th>Nilai</th></tr></thead>
    <tbody>${summary.map((s) => `<tr><td>${escapeHtml(s.label)}</td><td><strong>${escapeHtml(s.value)}</strong></td></tr>`).join('')}</tbody>
  </table>

  <div class="callout warn">
    <strong>Prioritas High sebelum staging:</strong> rate limiting login/reset (QA-SEC-19) · CSP + HSTS (QA-SEC-20) · scope pencarian global terapis (QA-SEC-32) · penghapusan audit log pada deleteUser (QA-SEC-33).
  </div>

  <h3>Temuan unggulan</h3>
  ${renderList([
    'Tidak ada rate limiting: 30 percobaan login gagal → 30× 401, nol 429 (QA-SEC-19).',
    'Content-Security-Policy & HSTS absen; nosniff/XFO/Referrer/Permissions-Policy sudah ada (QA-SEC-20).',
    'Pencarian global membocorkan nama/No. RM/telepon pasien lintas assignment untuk terapis (QA-SEC-32, High baru).',
    'deleteUser men-delete audit_logs & rekam klinis via raw SQL — pelanggaran AGENTS.md §6 (QA-SEC-33, High baru).',
    'Pendaftaran membocorkan status akun: 422 USER_ALREADY_EXISTS (QA-SEC-30).',
    'axe-core menemukan 3 regresi/percobaan baru: button-name critical di kartu pasien, kontras kalender terapis, semantik list carousel /tentang.',
    'Overflow horizontal 320 px pada landing (4 SVG kartu layanan ber-lebar tetap 320 px).',
  ])}
</section>

<!-- ══════════ BAB 2 ══════════ -->
<section class="chapter" id="bab-2">
  <h2 class="bab">Bab 2 — Lingkup, metode, dan 8 fase audit</h2>
  <h3>Lingkup</h3>
  ${scopeHtml}
  <h3>Lingkungan pengujian</h3>
  <table class="kv">${envRows}</table>
  <h3>Delapan fase</h3>
  <table class="grid">
    <thead><tr><th style="width:8%">Fase</th><th style="width:24%">Nama</th><th style="width:11%">Status</th><th>Bukti</th></tr></thead>
    <tbody>${phaseRows}</tbody>
  </table>
  <h3>Cakupan fungsional</h3>
  <table class="grid">
    <thead><tr><th style="width:24%">Area</th><th style="width:30%">Route</th><th style="width:13%">Status</th><th>Catatan</th></tr></thead>
    <tbody>${featureRows}</tbody>
  </table>
  <div class="callout">
    <strong>Prinsip pengujian:</strong> setiap klaim keamanan didukung bukti empiris (harness, curl, atau browser); setiap penilaian UI/UX didukung angka terukur (skor, rasio kontras, piksel viewport). Data uji seluruhnya dummy.
  </div>
</section>

<!-- ══════════ BAB 3 ══════════ -->
<section class="chapter" id="bab-3">
  <h2 class="bab">Bab 3 — Baseline &amp; quality gate (Fase 1)</h2>
  <p>Sebelum pengujian, baseline proyek diverifikasi agar seluruh temuan diukur dari kondisi yang diketahui sehat.</p>
  <table class="grid">
    <thead><tr><th style="width:30%">Gate</th><th style="width:18%">Hasil</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>TypeScript strict (tsc)</td><td class="pass">0 error</td><td>Seluruh file lolos type-check.</td></tr>
      <tr><td>ESLint</td><td class="pass">0 error</td><td>Tanpa warning yang diturunkan dari error.</td></tr>
      <tr><td>Vitest (pre-existing)</td><td class="pass">44/44 lulus</td><td>Unit test lama tetap hijau sebelum audit menambah test baru.</td></tr>
      <tr><td>next build</td><td class="pass">✓</td><td>BUILD_ID VDMt2Pof8rSKbB2wI6Apm; 15 halaman prerender.</td></tr>
      <tr><td>Dev server</td><td class="pass">✓ :3000</td><td>Dipakai untuk seluruh probe runtime &amp; pengukuran UI.</td></tr>
    </tbody>
  </table>
  <p>Baseline ini diulang setelah penambahan harness; total menjadi <strong>86 test</strong> — seluruhnya lulus (lihat Bab 12).</p>
</section>

<!-- ══════════ BAB 4 ══════════ -->
<section class="chapter" id="bab-4">
  <h2 class="bab">Bab 4 — Harness regresi otorisasi (Fase 2)</h2>
  <p>Berbeda dengan v1.0 yang memverifikasi cakupan klinis secara manual, v2.0 menambahkan harness otomatis <code>tests/authorization/clinical-scope.test.ts</code> (25 test) yang meniru perilaku server action terhadap database dengan mock berbasis pola <code>Symbol.for('drizzle:Name')</code>.</p>
  <table class="grid">
    <thead><tr><th style="width:10%">Skenario</th><th style="width:34%">Sasaran</th><th>Hasil</th></tr></thead>
    <tbody>
      <tr><td>S1</td><td>Terapis menulis rekam medis pasien tanpa assignment</td><td class="pass">5/5 ditolak "Akses ditolak"; kontrol positif DENGAN assignment berhasil — regresi QA-SEC-01 terjaga.</td></tr>
      <tr><td>S2</td><td>Ekspor PDF intake pasien bukan assignment</td><td class="pass">3/3 ForbiddenError + tanpa jejak audit; kontrol positif berhasil — regresi QA-SEC-02 terjaga.</td></tr>
      <tr><td>S3</td><td>IDOR lintas ID rekam medis (pasien &amp; terapis)</td><td class="pass">Akses rekam subjek lain selalu ditolak; rekam sendiri tetap terbaca (kontrol positif).</td></tr>
      <tr><td>S4</td><td>Matriks izin SA-005 antar role</td><td class="pass">Setiap role hanya memegang permission yang terdaftar di lib/permissions.</td></tr>
      <tr><td>+</td><td>Kontrol positif</td><td class="pass">6 test memastikan jalur yang sah tetap berfungsi — tes tidak "lulus kosong".</td></tr>
    </tbody>
  </table>
  <p><strong>Kontribusi ke temuan:</strong> harness ini mengonfirmasi perbaikan v1.0 (QA-SEC-01/02 kini <em>Verified</em>), sekaligus mengungkap area sejenis yang belum tercakup — penjadwalan janji temu tanpa cek assignment (QA-SEC-35) dan pencarian global (QA-SEC-32) diverifikasi lewat audit statis Fase 4.</p>
</section>

<!-- ══════════ BAB 5 ══════════ -->
<section class="chapter" id="bab-5">
  <h2 class="bab">Bab 5 — Pengujian injeksi &amp; validasi input (Fase 3)</h2>
  <p>Harness <code>tests/security/injection-guards.test.ts</code> — <strong>17/17 lulus</strong> — menguji lapisan pertahanan input:</p>
  <table class="grid">
    <thead><tr><th style="width:36%">Kelas serangan</th><th style="width:14%">Hasil</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>Prototype pollution (__proto__/constructor)</td><td class="pass">Tertahan</td><td>Payload tidak menularkan properti ke Object.prototype.</td></tr>
      <tr><td>Overflow panjang input</td><td class="pass">Tertahan</td><td>Batas panjang skema menolak sebelum query.</td></tr>
      <tr><td>Pelanggaran enum (role/status)</td><td class="pass">Tertahan</td><td>Zod enum menolak nilai di luar daftar.</td></tr>
      <tr><td>Regex nomor telepon</td><td class="pass">Tertahan</td><td>Normalisasi &amp; validasi konsisten.</td></tr>
      <tr><td>XSS sebagai data (&lt;script&gt;, onerror)</td><td class="pass">Aman</td><td>Disimpan sebagai data teks — diverifikasi tidak dirender sebagai markup.</td></tr>
      <tr><td>SQL injection sebagai data</td><td class="pass">Aman</td><td>Terparameterisasi; audit statis seluruh <code>sql&#96;</code> diperiksa.</td></tr>
    </tbody>
  </table>
  <p><strong>Audit statis pendukung:</strong> seluruh penggunaan <code>sql&#96;</code> Drizzle terparameterisasi (tanpa interpolasi string); satu-satunya <code>dangerouslySetInnerHTML</code> berada di <code>components/ui/chart.tsx</code> dan hanya memuat markup statis (bukan data eksternal).</p>
</section>

<!-- ══════════ BAB 6 ══════════ -->
<section class="chapter" id="bab-6">
  <h2 class="bab">Bab 6 — Audit statis keamanan (Fase 4)</h2>
  <p>Pemeriksaan manual terhadap 31 server action, kebijakan izin, konfigurasi auth, penyimpanan, template email, dan pola penghapusan. Area yang diverifikasi bersih atau tercakup: assignment <code>activeUntil IS NULL</code> konsisten di 18 file; scope dokumen memakai pola <code>therapistScope</code>; pencarian pasien mencakup nama/No. RM/email; jam operasional terpusat di <code>lib/clinic-hours.ts</code>.</p>
  <h3>Temuan dari fase ini</h3>
  <table class="grid">
    <thead><tr><th style="width:22%">ID</th><th style="width:44%">Temuan</th><th>Severity</th></tr></thead>
    <tbody>
      <tr><td><a href="#finding-QA-SEC-32">QA-SEC-32</a></td><td>Pencarian global tanpa scope assignment untuk terapis</td><td>High</td></tr>
      <tr><td><a href="#finding-QA-SEC-34">QA-SEC-34</a></td><td>Template email menyisipkan nama tanpa escaping HTML</td><td>Medium</td></tr>
      <tr><td><a href="#finding-QA-SEC-35">QA-SEC-35</a></td><td>Penjadwalan janji temu tanpa cek assignment terapis</td><td>Medium</td></tr>
      <tr><td><a href="#finding-QA-DATA-42">QA-DATA-42</a></td><td>KPI intake dashboard bersifat global untuk terapis</td><td>Info</td></tr>
      <tr><td><a href="#finding-QA-SEC-44">QA-SEC-44</a></td><td>Idle logout hanya di sisi klien</td><td>Low</td></tr>
      <tr><td><a href="#finding-QA-SEC-03">QA-SEC-03</a></td><td>Form auth tetap method="post" — regresi terjaga</td><td class="pass">Verified</td></tr>
      <tr><td><a href="#finding-QA-PERF-27">QA-PERF-27</a></td><td>Primitive UI tak terpakai masih ada (tetap Open)</td><td>Low</td></tr>
    </tbody>
  </table>
</section>

<!-- ══════════ BAB 7 ══════════ -->
<section class="chapter" id="bab-7">
  <h2 class="bab">Bab 7 — Probe runtime: header, autentikasi, API, IDOR (Fase 5)</h2>
  <p>Seluruh klaim keamanan runtime diuji empiris terhadap server berjalan. Ringkasan hasil (detail pada Bab 11):</p>
  <table class="grid">
    <thead><tr><th style="width:36%">Probe</th><th style="width:26%">Hasil</th><th>Penilaian</th></tr></thead>
    <tbody>
      <tr><td>Brute force 30× login</td><td><code>30 × 401 · 0 × 429</code></td><td class="fail">GAGAL — tanpa rate limiting (QA-SEC-19)</td></tr>
      <tr><td>Enumerasi login</td><td><code>401 identik</code></td><td class="pass">Lulus</td></tr>
      <tr><td>Enumerasi reset password</td><td><code>200 identik</code></td><td class="pass">Lulus</td></tr>
      <tr><td>Enumerasi sign-up</td><td><code>422 USER_ALREADY_EXISTS</code></td><td class="fail">GAGAL (QA-SEC-30)</td></tr>
      <tr><td>Header keamanan</td><td>nosniff ✓ XFO ✓ Referrer ✓ PP ✓</td><td class="fail">CSP ✗ HSTS ✗ (QA-SEC-20)</td></tr>
      <tr><td>Cookie sesi</td><td>HttpOnly ✓ SameSite=Lax ✓</td><td class="pass">Lulus</td></tr>
      <tr><td>API anonim stats/notifications</td><td><code>500</code></td><td class="fail">GAGAL — seharusnya 401 (QA-SEC-31)</td></tr>
      <tr><td>Cron tanpa secret</td><td><code>401</code></td><td class="pass">Fail-closed</td></tr>
      <tr><td>SSRF /api/regions</td><td><code>502</code>, host tetap</td><td class="pass">Terisolasi</td></tr>
      <tr><td>IDOR cetak rekam (browser)</td><td>404 kustom, 0 bocor</td><td class="pass">Lulus (lihat QA-SEC-41)</td></tr>
      <tr><td>IDOR terapis → rekam asing</td><td>0 kemunculan nama/No. RM</td><td class="pass">Lulus — kontrol positif rekam sendiri tampil</td></tr>
    </tbody>
  </table>
  <p><strong>Metode IDOR lintas subjek:</strong> rekam <code>4652197a…</code> (milik pasien lain) diakses dengan cookie pasien1 &amp; terapis. Body ditelusuri untuk nama asing "Chaterine Alexandria" dan No. RM "TS3126" → <strong>0 kemunculan</strong> di halaman detail maupun print; kontrol positif (rekam sendiri "Ahmad Fauzi") tetap tampil — membuktikan tes tidak kosong. Perhatikan: secara HTTP route print membalas 200 dengan halaman 404 di dalamnya (temuan QA-SEC-41, observabilitas).</p>
</section>

<!-- ══════════ BAB 8 ══════════ -->
<section class="chapter" id="bab-8">
  <h2 class="bab">Bab 8 — Pengukuran UI/UX terukur (Fase 6)</h2>
  <p>Penilaian UI/UX v2.0 memakai bukti objektif, bukan penilaian visual subyektif: skor Lighthouse (Chrome headless), axe-core 4.10.2 (WCAG 2.x A/AA) di 8 halaman, rasio kontras terhitung, dan matriks viewport iframe 320–1440 px.</p>
  ${measurementTables}
  <div class="callout">
    <strong>Metode matriks viewport:</strong> setiap halaman dimuat dalam iframe berlebar terkunci (320/360/390/430/768/1024/1280/1440 px), lalu <code>documentElement.scrollWidth</code> vs <code>clientWidth</code> dibandingkan; bila overflow, elemen pertama dengan <code>right &gt; clientWidth</code> dicatat sebagai penyebab.
  </div>
</section>

<!-- ══════════ BAB 9 ══════════ -->
<section class="chapter" id="bab-9">
  <h2 class="bab">Bab 9 — Pemetaan rute &amp; konsistensi PDF (Fase 7)</h2>
  <h3>Sweep rute — 38 route × 3 peran</h3>
  <table class="grid">
    <thead><tr><th style="width:20%">Peran</th><th style="width:30%">Ekspektasi</th><th>Hasil</th></tr></thead>
    <tbody>
      <tr><td>Anonim</td><td>Publik 200; /dashboard* redirect 307</td><td class="pass">Sesuai — 15 halaman publik 200, seluruh /dashboard* 307 ke login.</td></tr>
      <tr><td>Pasien (USER)</td><td>Portal 200; route staf 404</td><td class="pass">Sesuai — /dashboard/patients, /users, /audit-logs, /calendar dst. → 404.</td></tr>
      <tr><td>Terapis (THERAPIST)</td><td>Klinis 200; admin-only 404</td><td class="pass">Sesuai — /audit-logs, /calendar-events, /consent → 404; /users/add 200 <strong>by design</strong> (THERAPIST memiliki USER_CREATE untuk mendaftarkan pasien).</td></tr>
      <tr><td>API anonim</td><td>401/403</td><td class="fail">/api/dashboard/stats &amp; /api/notifications → 500; /api/documents/[id] → 404 (QA-SEC-31).</td></tr>
      <tr><td>API terautentikasi</td><td>Sesuai izin</td><td class="pass">avatar 200/401, reviews 200, regions 200, cron 401 semua peran.</td></tr>
    </tbody>
  </table>
  <h3>Regresi PDF rekam medis</h3>
  <table class="grid">
    <thead><tr><th style="width:30%">Kontrak</th><th style="width:16%">Status</th><th>Bukti struktural</th></tr></thead>
    <tbody>
      <tr><td>Cetak &amp; unduh identik</td><td class="pass">Verified</td><td>Satu pintu <code>renderMedicalRecordPdf()</code> dipakai <code>medical-record-print-client.tsx</code> (unduh) dan <code>medical-record-actions.tsx</code> (cetak) — tidak ada dua salinan kode.</td></tr>
      <tr><td>Tipografi 24/14/12 pt, LH 1,5</td><td class="pass">Verified</td><td>Konstanta <code>FONT</code> pada <code>medical-record-document.tsx</code>: header 24 · title 14 · body 12 · lineHeight 1.5.</td></tr>
      <tr><td>Footer "Halaman X dari Y" terpusat</td><td class="pass">Verified</td><td>Gaya <code>pageNumber: textAlign 'center'</code> + <code>fixed</code> pada ketiga cabang &lt;Page&gt;.</td></tr>
      <tr><td>Pengesahan halaman terakhir</td><td class="pass">Verified</td><td><code>signatureOnNewPage</code> — lembar pengesahan selalu &lt;Page&gt; terakhir tersendiri (regresi QA-PDF-08 terjaga).</td></tr>
      <tr><td>Tautan jadwal &amp; template cetak</td><td class="pass">Verified</td><td>Tidak ada rujukan /dashboard/schedule; appointment print memakai route print sendiri.</td></tr>
    </tbody>
  </table>
</section>

<!-- ══════════ BAB 10 ══════════ -->
<section class="chapter" id="bab-10">
  <h2 class="bab">Bab 10 — Integritas data &amp; kepatuhan (Fase 8)</h2>
  <h3>Mekanisme yang terverifikasi ada</h3>
  <table class="grid">
    <thead><tr><th style="width:32%">Perlindungan</th><th style="width:14%">Status</th><th>Bukti</th></tr></thead>
    <tbody>
      <tr><td>Soft-archive data klinis</td><td class="pass">Ada</td><td><code>archived_at</code> pada patients &amp; internal-calendar-events; intake memakai status ARCHIVED (bukan delete).</td></tr>
      <tr><td>Versioning rekam medis</td><td class="pass">Ada</td><td><code>amendedFromId</code>, <code>revisionNumber</code>, <code>supersededAt</code> — koreksi menghasilkan revisi baru, bukan menimpa.</td></tr>
      <tr><td>Consent (persetujuan)</td><td class="pass">Ada</td><td><code>withdrawnAt</code> — pencabutan dicatat sebagai keadaan, bukan penghapusan.</td></tr>
      <tr><td>Cakupan audit log</td><td class="pass">36 jenis aksi</td><td>Seluruh aksi sensitif (auth, klinis, admin) tercatat dengan actor &amp; meta.</td></tr>
      <tr><td>Backup &amp; retensi</td><td class="fail">Belum ada</td><td>Tidak ada skrip/berkas backup di repo; docs/REMAINING-WORK.md #3 masih terbuka (P0 dokumen).</td></tr>
    </tbody>
  </table>
  <h3>Pelanggaran &amp; risiko yang ditemukan</h3>
  <table class="grid">
    <thead><tr><th style="width:24%">Temuan</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td><a href="#finding-QA-SEC-33">QA-SEC-33 (High)</a></td><td><code>deleteUser</code> mengeksekusi raw SQL <code>DELETE FROM audit_logs / therapy_progress_records / patient_intakes</code> — pelanggaran langsung AGENTS.md §6 (larangan hard delete rekam klinis &amp; audit log) dan menghancurkan jejak audit.</td></tr>
      <tr><td><a href="#finding-QA-DATA-43">QA-DATA-43 (Info)</a></td><td>DB development memuat baris legacy dengan pola email realistis (gmail) di samping akun dummy — risiko tidak sengaja terbawa ke staging.</td></tr>
      <tr><td><a href="#finding-QA-DATA-42">QA-DATA-42 (Info)</a></td><td>KPI intake dashboard tidak ter-scope assignment untuk terapis (volume operasional klinik bocor).</td></tr>
    </tbody>
  </table>
  <div class="callout warn">
    <strong>Kepatuhan UU 27/2022 (PDP):</strong> ketiadaan backup/retensi terdokumentasi (Pasal 4 ketersediaan &amp; integritas) dan belum ada alur "right to be forgotten" (Pasal 56) — keduanya masuk daftar pengujian tambahan Bab 12.
  </div>
</section>

<!-- ══════════ BAB 11 ══════════ -->
<section class="chapter" id="bab-11">
  <h2 class="bab">Bab 11 — Matriks status v1.0 → v2.0 &amp; detail temuan</h2>
  <p>${escapeHtml(QA_REPORT.statusMatrixNote)}</p>
  <h3>Matriks status</h3>
  <table class="grid">
    <thead><tr><th style="width:14%">ID</th><th style="width:38%">Temuan</th><th style="width:9%">Sev</th><th style="width:11%">v1.0</th><th style="width:13%">v2.0</th><th>Fase</th></tr></thead>
    <tbody>${matrixRows}</tbody>
  </table>
  <h3>Detail temuan (${QA_REPORT.findings.length}) — urut prioritas</h3>
  ${findingsHtml}
</section>

<!-- ══════════ BAB 12 ══════════ -->
<section class="chapter" id="bab-12">
  <h2 class="bab">Bab 12 — Saran pengujian tambahan &amp; rekomendasi rilis</h2>
  <h3>Pengujian tambahan yang belum tercakup</h3>
  ${additionalHtml}
  <h3>Positif yang harus dipertahankan</h3>
  ${positiveHtml}
  <h3>Catatan metode</h3>
  ${notesHtml}
  <div class="final">
    <h3>Rekomendasi rilis</h3>
    <p>${escapeHtml(QA_REPORT.recommendation)}</p>
  </div>
</section>

</body>
</html>`;

  // Format: YYYY-MM-DD dari "17 November 2026"
  const months: Record<string, string> = {
    Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06',
    Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12',
  };
  const [day, monthName, year] = QA_REPORT.date.split(' ');
  const isoDate = `${year}-${months[monthName] ?? '01'}-${day.padStart(2, '0')}`;

  const outDir = 'artifacts/qa';
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `qa-report-hafta-${isoDate}.html`);
  await writeFile(outPath, html, 'utf8');
  console.log(`✓ ${outPath}`);
  console.log(`  Temuan: ${QA_REPORT.findings.length} · TOC pages: ${Object.keys(tocPages).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
