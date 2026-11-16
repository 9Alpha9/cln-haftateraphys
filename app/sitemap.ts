import type { MetadataRoute } from 'next';
import { services } from '@/components/landing/services-data';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haftafisioterapi.my.id';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = ['', '/layanan', '/tentang', '/kontak', '/faq', '/privacy', '/terms'];

  return [
    ...publicRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
    })),
    ...services.map((service) => ({
      url: `${baseUrl}/layanan/${service.id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
