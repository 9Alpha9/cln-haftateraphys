'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface InstagramCarouselProps {
  images: string[];
}

function getVisibleImages(width: number) {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 520) return 2;
  return 1;
}

export function InstagramCarousel({ images }: InstagramCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visibleImages, setVisibleImages] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const pages = useMemo(() => {
    const groupedImages = [];

    for (let index = 0; index < images.length; index += visibleImages) {
      groupedImages.push(images.slice(index, index + visibleImages));
    }

    return groupedImages;
  }, [images, visibleImages]);
  const displayedIndex = Math.min(activeIndex, pages.length - 1);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextVisibleImages = getVisibleImages(entry.contentRect.width);
      setVisibleImages((current) => (current === nextVisibleImages ? current : nextVisibleImages));
    });

    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || pages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % pages.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [pages.length, reduceMotion]);

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + pages.length) % pages.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % pages.length);
  };

  return (
    <div ref={carouselRef} className="mx-auto mt-8 w-full max-w-7xl text-center">
      <div className="overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-center gap-2 pb-3 text-xs font-medium text-foreground sm:pb-4">
          <Image
            src="/images/logos/logos.png"
            alt=""
            width={24}
            height={24}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>Latest @hafta.fisioterapi Posts</span>
        </div>

        <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[16/5]">
          {pages.map((page, pageIndex) => (
            <motion.div
              key={page.join('-')}
              initial={false}
              animate={{ opacity: pageIndex === displayedIndex ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 grid gap-1.5 sm:grid-cols-2 sm:gap-2 md:grid-cols-3 xl:grid-cols-4"
              aria-hidden={pageIndex !== displayedIndex}
            >
              {page.map((image, imageIndex) => (
                <a
                  key={image}
                  href="https://www.instagram.com/hafta.fisioterapi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={pageIndex === displayedIndex ? 0 : -1}
                  className="group relative block h-full overflow-hidden rounded-sm bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src={image}
                    alt={`Aktivitas Hafta Fisioterapi ${pageIndex * visibleImages + imageIndex + 1}`}
                    fill
                    sizes="(max-width: 520px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105"
                    quality={100}
                    loading={pageIndex === 0 && imageIndex === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-emerald-950/0 transition-colors duration-300 group-hover:bg-emerald-950/20" />
                  <ExternalLink className="absolute right-2 top-2 h-4 w-4 text-white opacity-0 drop-shadow transition-opacity duration-300 group-hover:opacity-100" />
                </a>
              ))}
            </motion.div>
          ))}
        </div>

        <div className="relative mt-3 flex min-h-9 items-center justify-center">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Slide Instagram sebelumnya"
            className="absolute left-0  inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5" aria-label={`Slide ${displayedIndex + 1} dari ${pages.length}`}>
            {pages.map((page, pageIndex) => (
              <button
                key={page.join('-')}
                type="button"
                onClick={() => setActiveIndex(pageIndex)}
                aria-label={`Tampilkan slide Instagram ${pageIndex + 1}`}
                aria-current={pageIndex === displayedIndex ? 'true' : undefined}
                className={`h-1.5  cursor-pointer rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  pageIndex === displayedIndex ? 'w-4 bg-primary' : 'w-1.5 bg-primary/25 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={showNext}
            aria-label="Slide Instagram berikutnya"
            className="absolute  right-0 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <a
        href="https://www.instagram.com/hafta.fisioterapi/"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-4 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-surface px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-sage-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
        </svg>
        Follow kami di Instagram
      </a>
    </div>
  );
}
