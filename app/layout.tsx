import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { FloatingWhatsApp } from '@/components/ui/floating-whatsapp';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hafta Fisioterapi',
  description: 'Sistem manajemen klinik fisioterapi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
