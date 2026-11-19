import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    qualities: [100, 75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Keep prefetched dashboard shells in the client router cache so moving
    // between pages does not trigger a full server round-trip every click.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    // CSP tidak lagi di sini: header CSP dibuat per-request di `proxy.ts` agar
    // memakai nonce. Header statis di sini akan bertabrakan (dua CSP = irisan)
    // dan mematikan nonce.
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          ...(process.env.NODE_ENV !== 'development'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
