'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotchedCardVariant = 'white' | 'accent' | 'dark';

export interface NotchedCardProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  badge?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  buttonText?: string;
  variant?: NotchedCardVariant;
  className?: string;
  showRings?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<
  NotchedCardVariant,
  {
    fillColor: string;
    strokeColor: string;
    dropShadow: string;
    textTitle: string;
    textBody: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    buttonBg: string;
    buttonText: string;
    buttonBorder: string;
    ringColor: string;
  }
> = {
  white: {
    fillColor: '#FFFFFF',
    strokeColor: '#E7E5E4', // stone-200
    dropShadow: 'drop-shadow(0 10px 25px rgba(24, 23, 0, 0.04))',
    textTitle: 'text-[var(--hafta-ylw-950)]',
    textBody: 'text-stone-600',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    iconBg: 'bg-[#FEFEF6] border border-stone-200/90 text-[var(--hafta-ylw-950)]',
    buttonBg: 'bg-white hover:bg-[var(--hafta-ylw-100)]',
    buttonText: 'text-[var(--hafta-ylw-950)]',
    buttonBorder: 'border border-stone-200/90 hover:border-[var(--hafta-ylw-200)] shadow-2xs',
    ringColor: 'stroke-stone-300/45',
  },
  accent: {
    fillColor: 'var(--hafta-ylw-100, #f7f000)', // Hafta Yellow
    strokeColor: 'var(--hafta-ylw-200, #e3db00)',
    dropShadow: 'drop-shadow(0 14px 28px rgba(247, 240, 0, 0.22))',
    textTitle: 'text-[var(--hafta-ylw-950)]',
    textBody: 'text-[var(--hafta-ylw-900)]/85',
    badgeBg: 'bg-[var(--hafta-ylw-950)]/10',
    badgeText: 'text-[var(--hafta-ylw-950)]',
    iconBg: 'bg-white text-[var(--hafta-ylw-950)] shadow-2xs',
    buttonBg: 'bg-[var(--hafta-ylw-100)] hover:bg-[var(--hafta-ylw-200)]',
    buttonText: 'text-[var(--hafta-ylw-950)]',
    buttonBorder: 'border border-[var(--hafta-ylw-300)]/60 shadow-2xs',
    ringColor: 'stroke-[var(--hafta-ylw-950)]/12',
  },
  dark: {
    fillColor: 'var(--hafta-ylw-950, #181700)', // Deep Hafta Charcoal
    strokeColor: 'var(--hafta-ylw-800, #3a3700)',
    dropShadow: 'drop-shadow(0 14px 30px rgba(24, 23, 0, 0.2))',
    textTitle: 'text-white',
    textBody: 'text-stone-300',
    badgeBg: 'bg-white/10',
    badgeText: 'text-[var(--hafta-ylw-100)]',
    iconBg: 'bg-[var(--hafta-ylw-900)] text-[var(--hafta-ylw-100)] border border-[var(--hafta-ylw-800)]',
    buttonBg: 'bg-[var(--hafta-ylw-950)] hover:bg-[var(--hafta-ylw-100)]',
    buttonText: 'text-white hover:text-[var(--hafta-ylw-950)]',
    buttonBorder: 'border border-[var(--hafta-ylw-800)] hover:border-[var(--hafta-ylw-100)] shadow-2xs',
    ringColor: 'stroke-white/12',
  },
};

export function NotchedCard({
  icon: Icon,
  badge,
  title,
  description,
  href,
  onClick,
  buttonText = 'Lihat Detail',
  variant = 'white',
  className,
  showRings = false,
  children,
}: NotchedCardProps) {
  const styles = variantStyles[variant];
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 320, h: 320 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Geometri Notch & Radius
  const { w, h } = size;
  const R = 28; // Radius sudut utama kartu
  const r = 20; // Radius sudut sekeliling ceruk (notch) & inverted fillet
  const nw = Math.min(230, Math.max(180, w * 0.6)); // Lebar ceruk (notch width) di kiri bawah
  const nh = 56; // Tinggi ceruk (notch height) di kiri bawah
  const s = 0.75; // Inset 0.75px agar stroke 1.5px tidak terpotong di tepi viewBox

  // Single continuous SVG path untuk kartu dengan ceruk kiri-bawah yang 100% transparan
  const notchedPath = `
    M ${R} ${s}
    H ${w - R}
    A ${R - s} ${R - s} 0 0 1 ${w - s} ${R}
    V ${h - R}
    A ${R - s} ${R - s} 0 0 1 ${w - R} ${h - s}
    H ${nw + r}
    A ${r} ${r} 0 0 1 ${nw} ${h - s - r}
    V ${h - nh + r}
    A ${r} ${r} 0 0 0 ${nw - r} ${h - nh}
    H ${r}
    A ${r - s} ${r - s} 0 0 1 ${s} ${h - nh - r}
    V ${R}
    A ${R - s} ${R - s} 0 0 1 ${R} ${s}
    Z
  `;

  const clipId = React.useId();

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1.5',
        className
      )}
    >
      {/* ── 1. TRUE TRANSPARENT SVG SILHOUETTE & CONTINUOUS BORDER ── */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ filter: styles.dropShadow }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={notchedPath} />
          </clipPath>
        </defs>

        {/* Badan Kartu + Garis Tepi (Inverted Outline 100% Mulus Tanpa Garis Bocor) */}
        <path
          d={notchedPath}
          fill={styles.fillColor}
          stroke={styles.strokeColor}
          strokeWidth="1.25"
          strokeLinejoin="round"
        />

        {/* Watermark Concentric Rings (Terkunci di dalam clipPath kartu) */}
        {showRings && (
          <g clipPath={`url(#${clipId})`}>
            <circle cx={w + 10} cy={h + 10} r="36" strokeWidth="1.5" className={styles.ringColor} />
            <circle cx={w + 10} cy={h + 10} r="62" strokeWidth="1.5" className={styles.ringColor} />
            <circle cx={w + 10} cy={h + 10} r="88" strokeWidth="1.5" className={styles.ringColor} />
            <circle cx={w + 10} cy={h + 10} r="114" strokeWidth="1.5" className={styles.ringColor} />
          </g>
        )}
      </svg>

      {/* ── 2. CARD CONTENT ── */}
      <div
        className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-6"
        style={{ paddingBottom: nh + 20 }}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            {Icon && (
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', styles.iconBg)}>
                {React.isValidElement(Icon) ? (
                  Icon
                ) : typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null) ? (
                  // @ts-expect-error dynamic component
                  <Icon className="h-5 w-5" />
                ) : null}
              </div>
            )}
            {badge && (
              <div className="flex justify-end">
                {typeof badge === 'string' ? (
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', styles.badgeBg, styles.badgeText)}>
                    {badge}
                  </span>
                ) : (
                  badge
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <h3 className={cn('text-base sm:text-lg font-bold tracking-tight', styles.textTitle)}>
              {title}
            </h3>
            {description && (
              <div className={cn('mt-2 text-xs sm:text-sm leading-relaxed', styles.textBody)}>
                {description}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>

      {/* ── 3. PILL BUTTON (DI DALAM CERUK TRANSPARAN KIRI BAWAH) ── */}
      <div
        className="absolute bottom-1.5 left-1 z-20 flex items-center"
        style={{
          height: nh - 10,
          maxWidth: nw - 10,
        }}
      >
        {href ? (
          <Link
            href={href}
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold transition-all duration-200 group-hover:gap-2 sm:gap-2 sm:px-4 sm:text-xs',
              styles.buttonBg,
              styles.buttonText,
              styles.buttonBorder
            )}
          >
            <span>{buttonText}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className={cn(
              'inline-flex max-w-full cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold transition-all duration-200 group-hover:gap-2 sm:gap-2 sm:px-4 sm:text-xs',
              styles.buttonBg,
              styles.buttonText,
              styles.buttonBorder
            )}
          >
            <span>{buttonText}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
