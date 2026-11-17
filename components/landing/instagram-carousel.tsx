'use client';

import Image from 'next/image';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InstagramCarouselProps {
  images: string[];
  /** Profil Instagram resmi yang dibuka saat gambar atau tautan diklik. */
  profileUrl?: string;
}

const DEFAULT_PROFILE_URL = 'https://www.instagram.com/hafta.fisioterapi/';

/**
 * Galeri Instagram bergaya carousel dengan gulir native.
 *
 * Prinsip desain: tanpa rotasi otomatis (konten tidak bergerak sendiri),
 * tanpa kartu-di-dalam-kartu, dan hanya memakai warna charcoal/stone/oranye
 * Hafta 300 agar selaras dengan pedoman warna proyek.
 */
export function InstagramCarousel({
  images,
  profileUrl = DEFAULT_PROFILE_URL,
}: InstagramCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  // 0 = belum diukur. Titik navigasi disembunyikan sampai jumlah pastinya
  // diketahui agar tidak muncul kilatan jumlah yang salah saat hidrasi.
  const [positionCount, setPositionCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * Jumlah posisi berhenti dihitung dari rentang gulir sebenarnya, bukan dari
   * breakpoint viewport. Cara ini tetap akurat ketika lebar kartu diatur lewat
   * kelas responsif yang tidak sejalan dengan lebar kontainer.
   */
  const measurePositions = useCallback(() => {
    const scroller = scrollerRef.current;
    const firstCard = scroller?.children[0] as HTMLElement | undefined;
    if (!scroller || !firstCard) return;

    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    if (step <= 0) return;

    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const nextCount = Math.max(1, Math.round(maxScroll / step) + 1);

    setPositionCount(nextCount);
    setActiveIndex((current) => Math.min(current, nextCount - 1));
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    measurePositions();

    const observer = new ResizeObserver(() => measurePositions());
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [measurePositions]);

  /** Indeks aktif diturunkan dari posisi geser, bukan disimpan terpisah. */
  const syncActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerLeft = scroller.getBoundingClientRect().left;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(scroller.children).forEach((child, index) => {
      const distance = Math.abs(child.getBoundingClientRect().left - scrollerLeft);
      if (distance < closestDistance - 0.5) {
        closestDistance = distance;
        closest = index;
      }
    });

    setActiveIndex(Math.min(closest, Math.max(0, positionCount - 1)));
  }, [positionCount]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.addEventListener('scroll', syncActiveIndex, { passive: true });
    return () => scroller.removeEventListener('scroll', syncActiveIndex);
  }, [syncActiveIndex]);

  /** Geser tepat satu kartu; peramban akan membulatkan ke titik snap terdekat. */
  const moveBy = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const firstCard = scroller.children[0] as HTMLElement | undefined;
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + gap : scroller.clientWidth * 0.8;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * cardWidth,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  const moveToPosition = useCallback((position: number) => {
    const scroller = scrollerRef.current;
    const target = scroller?.children[position] as HTMLElement | undefined;
    if (!scroller || !target) return;

    const delta = target.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({ left: delta, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveBy(1);
    }
  };

  const isAtStart = activeIndex === 0;
  const isAtEnd = positionCount > 0 && activeIndex >= positionCount - 1;

  return (
    <div className="mx-auto mt-10 w-full max-w-7xl">
      {/* Kontrol desktop: ringkas, sejajar kanan, tidak menutupi gambar. */}
      <div className="mb-4 hidden items-center justify-end gap-2 sm:flex">
        <button
          type="button"
          onClick={() => moveBy(-1)}
          disabled={isAtStart}
          aria-label="Geser galeri ke kiri"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => moveBy(1)}
          disabled={isAtEnd}
          aria-label="Geser galeri ke kanan"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300 disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/*
        Gulir asli peramban: geser dengan jari di mobile, trackpad/Shift+wheel di
        desktop, dan tombol panah saat area ini difokus. Tidak ada rotasi otomatis
        agar konten tidak bergerak sendiri.
      */}
      {/* Wrapper landmark + keyboard focus untuk navigasi galeri. role="region"
          diletakkan di div pembungkus (bukan di <ul>) agar <li> tetap berperan
          sebagai daftar menurut AX-tree (fix QA-A11Y-38). */}
      <div
        role="region"
        aria-label="Galeri dokumentasi Instagram Hafta Fisioterapi"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] focus-visible:ring-offset-2"
      >
        <ul
          ref={scrollerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 scroll-px-4',
            'sm:mx-0 sm:gap-4 sm:px-0 sm:scroll-px-0',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {images.map((image, index) => (
            <li
              key={image}
              className="w-[76%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%]"
            >
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka dokumentasi Instagram Hafta Fisioterapi nomor ${index + 1} di tab baru`}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                <Image
                  src={image}
                  alt={`Dokumentasi aktivitas Hafta Fisioterapi ${index + 1}`}
                  fill
                  sizes="(max-width: 639px) 78vw, (max-width: 1023px) 47vw, (max-width: 1279px) 32vw, 24vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  quality={90}
                  loading={index < 2 ? 'eager' : 'lazy'}
                />
                {/* Penanda halus bahwa kartu membuka Instagram. */}
                <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </a>
          </li>
        ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Titik navigasi: area sentuh 44px, tampilan tetap tipis. */}
        {positionCount > 1 ? (
          <div className="flex items-center" role="group" aria-label="Navigasi galeri">
            {Array.from({ length: positionCount }, (_, position) => (
              <button
                key={position}
                type="button"
                onClick={() => moveToPosition(position)}
                aria-label={`Ke posisi galeri ${position + 1} dari ${positionCount}`}
                aria-current={position === activeIndex ? 'true' : undefined}
                className="group flex h-11 w-5 cursor-pointer items-center justify-center focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-300',
                    position === activeIndex
                      ? 'w-5 bg-[var(--hafta-950)]'
                      : 'w-1.5 bg-stone-300 group-hover:bg-stone-400',
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 self-start whitespace-nowrap text-sm font-semibold text-stone-700 transition-colors hover:text-[var(--hafta-950)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hafta-300)] focus-visible:ring-offset-2 sm:self-auto"
        >
          Lihat semua di Instagram
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
