'use client';

import { useEffect, useMemo } from 'react';
import { createIncidentReference } from '@/lib/error-catalog';

/**
 * Global error menangani kegagalan pada root layout. Karena root layout tidak
 * dirender, halaman ini sengaja memakai inline style dan tidak bergantung pada
 * Tailwind/global CSS agar tetap terbaca saat aset gagal dimuat.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reference = useMemo(() => createIncidentReference(500, error.digest), [error.digest]);

  useEffect(() => {
    console.error('[global.error]', {
      digest: error.digest ?? null,
      name: error.name,
      message: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#FCFCFB',
          color: '#181700',
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <main style={{ width: '100%', maxWidth: 520 }}>
          <div
            style={{
              border: '1px solid #e7e5e4',
              borderRadius: 24,
              background: '#fff',
              padding: 28,
              boxShadow: '0 18px 50px -32px rgba(24,23,0,0.35)',
            }}
          >
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', fontWeight: 700, color: '#a8a29e' }}>
              ERROR 500 · HAFTA FISIOTERAPI
            </p>
            <h1 style={{ margin: '8px 0 0', fontSize: 24, lineHeight: 1.25 }}>Terjadi kesalahan sistem</h1>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.65, color: '#57534e' }}>
              Aplikasi gagal memuat komponen utama. Data Anda tidak terkirim atau berubah. Muat ulang
              halaman; bila masalah berulang, laporkan referensi insiden di bawah kepada admin.
            </p>

            <div style={{ marginTop: 18, borderRadius: 16, background: '#FAFAF8', padding: 14 }}>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, color: '#78716c' }}>
                REFERENSI INSIDEN
              </p>
              <p style={{ margin: '4px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                {reference}
              </p>
              {error.digest ? (
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#a8a29e' }}>Digest: {error.digest}</p>
              ) : null}
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: 44,
                  border: 0,
                  borderRadius: 999,
                  background: '#FFE8C7',
                  color: '#181700',
                  padding: '0 20px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Muat ulang
              </button>
              <a
                href="/status?code=500"
                style={{
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  border: '1px solid #e7e5e4',
                  background: '#fff',
                  color: '#44403c',
                  padding: '0 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Informasi kendala
              </a>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 11, color: '#a8a29e' }}>
            Halaman ini tidak menampilkan data rekam medis.
          </p>
        </main>
      </body>
    </html>
  );
}
