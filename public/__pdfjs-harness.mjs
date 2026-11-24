// Harness uji lokal: meniru iframe `srcDoc` yang dipakai aplikasi untuk viewer
// PDF.js Generic Viewer + hafta-bridge.js (origin "null"), termasuk konfigurasi
// CSP `csp` milik iframe dan pemuatan aset lewat batas origin (absolute URL).
const frame = document.getElementById('f');
const status = document.getElementById('status');
const origin = window.location.origin;
const log = [];
let opened = false;
let viewerWindow = null;

function render() {
  status.textContent = JSON.stringify(log);
}

function bat(path) {
  return origin + path;
}

function buildDocument() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Hafta Docs</title>
<script src="${bat('/pdfjs/build/pdf.mjs')}" type="module"></script>
<script src="${bat('/pdfjs/web/viewer.mjs')}" type="module"></script>
<script src="${bat('/pdfjs/web/hafta-bridge.js')}"></script>
</head>
<body>
<iframe src="${bat('/pdfjs/web/viewer.html?probe=1')}" title="raw viewer" style="width:1px;height:1px;opacity:0"></iframe>
<script>
document.addEventListener('hafta-doc-ready', function () {
  window.parent.postMessage({ type: 'harness-doc-ready', hasApp: 'PDFViewerApplication' in window, hasBridge: !!window.__haftaBridgeMarker }, '*');
});
</script>
</body>
</html>`;
}

window.addEventListener('message', (event) => {
  const data = event.data || {};
  if (typeof data !== 'object') return;
  log.push({ type: data.type, state: data.state, fromFrame: viewerWindow !== null && event.source === frame.contentWindow, hasApp: data.hasApp, hasBridge: data.hasBridge });
  render();
  if (data.type === 'hafta-pdf-viewer:ready' && !opened) {
    opened = true;
    event.source.postMessage({ type: 'hafta-pdf-viewer:open', url: bat('/__sample.pdf'), fileName: 'Contoh Dokumen.pdf' }, '*');
  }
});

frame.addEventListener('load', () => {
  viewerWindow = frame.contentWindow;
  log.push({ load: 'srcdoc' });
  render();
  try {
    viewerWindow.postMessage({ type: 'hafta-pdf-viewer:ping' }, '*');
  } catch (error) {
    log.push({ postError: String(error) });
    render();
  }
});

frame.setAttribute('srcdoc', buildDocument());

// Ekspos ke tooling (page world) untuk inspeksi manual.
window.__harness = {
  log,
  frame,
  viewerWindow: () => viewerWindow,
  origin,
};
