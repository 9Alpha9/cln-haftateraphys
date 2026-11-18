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
    // React dev-mode tooling (callstack reconstruction) requires eval(); only
    // enable 'unsafe-eval' in development so production CSP stays strict.
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com"
      : "script-src 'self' 'unsafe-inline' https://www.google.com";

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
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-src 'self' blob:`,
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
