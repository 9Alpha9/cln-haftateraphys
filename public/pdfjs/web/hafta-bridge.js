/**
 * Hafta bridge — adaptor kecil di dalam PDF.js Generic Viewer.
 *
 * Viewer resmi tidak menyediakan API lintas-dokumen untuk menerima berkas dari
 * aplikasi induk (opsi `?file=` hanya menerima URL dan menuliskan URL rekam
 * medis ke address bar/riwayat). Berkas ini menambahkan satu kanal `postMessage`
 * yang memanggil API resmi `PDFViewerApplication.open()`.
 *
 * Yang TIDAK dilakukan di sini: tidak ada toolbar, navigasi, zoom, pencarian,
 * sidebar, atau kontrol cetak/unduh buatan sendiri — semuanya tetap milik
 * Generic Viewer.
 */
(function haftaPdfViewerBridge() {
  'use strict';

  var READY = 'hafta-pdf-viewer:ready';
  var OPEN = 'hafta-pdf-viewer:open';
  var STATE = 'hafta-pdf-viewer:state';

  function post(message) {
    try {
      window.parent.postMessage(message, window.location.origin);
    } catch (_) {
      // Induk tidak dapat dijangkau (mis. viewer dibuka langsung): abaikan.
    }
  }

  function announceReady() {
    post({ type: READY });
  }

  function announceState(state) {
    post({ type: STATE, state: state });
  }

  function getApplication() {
    return window.PDFViewerApplication || null;
  }

  async function openDocument(payload) {
    var application = getApplication();
    if (!application) return;
    try {
      await application.initializedPromise;
    } catch (_) {
      // Inisialisasi gagal; biarkan viewer menampilkan pesannya sendiri.
    }
    if (!payload || !payload.url) return;

    announceState('loading');
    try {
      await application.open({
        url: payload.url,
        // Nama berkas dipakai tombol Unduh milik viewer.
        originalUrl: payload.fileName ? encodeURIComponent(payload.fileName) : undefined,
      });
      announceState('ready');
    } catch (error) {
      announceState('error');
      if (window.console) {
        console.error(
          '[hafta-pdf] gagal membuka dokumen',
          error && error.message ? error.message : 'unknown',
        );
      }
    }
  }

  window.addEventListener('message', function onMessage(event) {
    // Hanya terima pesan dari aplikasi induk pada origin yang sama.
    if (event.origin !== window.location.origin) return;
    if (event.source !== window.parent) return;

    var data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === OPEN) {
      void openDocument(data);
    } else if (data.type === 'hafta-pdf-viewer:ping') {
      announceReady();
    }
  });

  function waitForApplication() {
    if (getApplication()) {
      announceReady();
      return;
    }
    window.setTimeout(waitForApplication, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForApplication, { once: true });
  } else {
    waitForApplication();
  }
})();
