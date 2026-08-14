'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

const panelImages = [
  '/images/backgrounds/bg-hf-10.png',
  '/images/backgrounds/bg-hf-11.png',
  '/images/backgrounds/bg-hf-2.png',
  '/images/backgrounds/bg-hf-4.png',
];

interface AuthShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthShell({ children, title, description }: AuthShellProps) {
  const [activeImage, setActiveImage] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % panelImages.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <div className="relative min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-0 hidden w-1/2 overflow-hidden bg-emerald-900 lg:block">
        <AnimatePresence initial={false}>
          <motion.div
            key={panelImages[activeImage]}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: reduceMotion ? 0 : 1.1, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Image
              src={panelImages[activeImage]}
              alt=""
              fill
              sizes="50vw"
              className="pointer-events-none object-cover object-center"
              quality={100}
              priority
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/65 to-emerald-950/30" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 xl:p-16">
          <Image
            src="/images/logos/logos-text.png"
            alt="Hafta Fisioterapi"
            width={220}
            height={52}
            className="h-auto w-48 brightness-0 invert"
            priority
          />
          <h2 className="mt-8 max-w-md text-3xl font-bold leading-tight text-white xl:text-4xl">Hafta Fisioterapi</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
            Klinik fisioterapi profesional untuk pemulihan optimal
          </p>
          <div className="mt-8 flex gap-2" aria-hidden="true">
            {panelImages.map((image, index) => (
              <span
                key={image}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === activeImage ? 'w-8 bg-white' : 'w-3 bg-white/45'
                }`}
              />
            ))}
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 lg:ml-[50%] lg:w-1/2 lg:px-12 xl:px-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
          <div className="mb-8 text-center">
            {title && <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">{title}</h1>}
            {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
