import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haftafisioterapi.my.id';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/layanan', '/tentang', '/kontak', '/faq', '/privacy', '/terms'],
        disallow: ['/dashboard/', '/login', '/register', '/forgot-password', '/reset-password', '/api/', '/status', '/forbidden', '/unauthorized', '/maintenance'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
