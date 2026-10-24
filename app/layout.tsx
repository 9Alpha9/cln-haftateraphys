import type { Metadata } from 'next';
import { Inter, Satisfy } from 'next/font/google';
import { FloatingWhatsApp } from '@/components/ui/floating-whatsapp';
import { ToastProvider } from '@/components/ui/toast';
import { Sonner } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const satisfy = Satisfy({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-satisfy',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Hafta Fisioterapi',
    template: '%s | Hafta Fisioterapi',
  },
  description:
    'Klinik fisioterapi profesional di Kabupaten Sidoarjo. Layanan rehabilitasi, terapi nyeri, dan pemulihan cedera oleh fisioterapis berpengalaman dan berijazah.',
  metadataBase: new URL('https://haftafisioterapi.my.id'),
  keywords: [
    'fisioterapi',
    'fisioterapi sidoarjo',
    'klinik fisioterapi',
    'fisioterapi Kabupaten Sidoarjo',
    'rehabilitasi fisioterapi',
    'terapi nyeri',
    'pemulihan cedera',
    'hafta fisioterapi',
    'fisioterapis berijazah',
  ],
  authors: [{ name: 'Hafta Fisioterapi', url: 'https://haftafisioterapi.my.id' }],
  creator: 'Hafta Fisioterapi',
  publisher: 'Hafta Fisioterapi',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://haftafisioterapi.my.id',
  },
  openGraph: {
    title: 'Hafta Fisioterapi',
    description:
      'Klinik fisioterapi profesional di Kabupaten Sidoarjo. Rehabilitasi, terapi nyeri, dan pemulihan cedera oleh fisioterapis berpengalaman.',
    url: 'https://haftafisioterapi.my.id',
    siteName: 'Hafta Fisioterapi',
    images: [
      {
        url: '/images/og/og-metadata-hafta-fisioterapy.webp',
        width: 1200,
        height: 630,
        alt: 'Hafta Fisioterapi – Klinik Fisioterapi Profesional di Kabupaten Sidoarjo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hafta Fisioterapi',
    description:
      'Klinik fisioterapi profesional di Kabupaten Sidoarjo. Rehabilitasi, terapi nyeri, dan pemulihan cedera.',
    images: ['/images/og/og-metadata-hafta-fisioterapy.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${satisfy.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Sonner />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
