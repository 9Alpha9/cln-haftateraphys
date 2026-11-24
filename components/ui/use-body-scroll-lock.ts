'use client';

import { useEffect } from 'react';

import { isMobileViewport } from '@/lib/device/viewport';

/**
 * Reference-counted body scroll lock shared by every overlay (slide-over,
 * modal, confirm dialog, Base UI dialog, logout modal).
 *
 * Desktop (mouse): cukup `overflow: hidden` pada html/body. Scrollbar tidak
 * bergeser karena ruangnya dikompensasi, dan posisi scroll halaman tidak
 * berubah sedikit pun.
 *
 * Mobile / touch: `overflow: hidden` di iOS Safari masih membiarkan halaman
 * di-scroll lewat sentuhan (rubber-band), sehingga drawer "bocor" ke
 * background. Karena itu body dikunci dengan `position: fixed` + `top: -scrollY`.
 * Pada desktop `position: fixed` tidak dipakai karena browser tetap
 * menyesuaikan posisi scroll (scroll anchoring) saat fokus berpindah ke panel,
 * sehingga halaman bisa melompat naik setelah drawer ditutup.
 *
 * Overlay yang ditumpuk (drawer + sub-drawer + confirm dialog) memakai counter
 * referensi supaya menutup satu drawer tidak membuka kembali scroll background
 * selama masih ada overlay lain yang aktif. Posisi scroll asli hanya diambil
 * sekali saat lock pertama dan dikembalikan sekali saat lock terakhir.
 */

type SavedScrollLockStyles = {
  htmlOverflow: string;
  htmlOverscroll: string;
  bodyOverflow: string;
  bodyOverscroll: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyPaddingRight: string;
  /** `fixed` hanya dipakai di mobile/touch; desktop cukup overflow. */
  usesFixedPosition: boolean;
  scrollX: number;
  scrollY: number;
};

let scrollLockCount = 0;
let savedScrollStyles: SavedScrollLockStyles | null = null;

function acquireScrollLock() {
  if (typeof document === 'undefined') return;

  if (scrollLockCount > 0) {
    scrollLockCount += 1;
    return;
  }

  const html = document.documentElement;
  const body = document.body;

  // Ambil posisi scroll SEBELUM body dipindah ke `position: fixed`.
  const scrollX = window.scrollX || html.scrollLeft || 0;
  const scrollY = window.scrollY || html.scrollTop || 0;
  const scrollBarWidth = window.innerWidth - html.clientWidth;
  const usesFixedPosition = isMobileViewport();

  savedScrollStyles = {
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverflow: body.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    bodyPaddingRight: body.style.paddingRight,
    usesFixedPosition,
    scrollX,
    scrollY,
  };

  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';

  if (usesFixedPosition) {
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = '0';
    body.style.width = '100%';
  }

  // Kompensasi lebar scrollbar supaya layout tidak bergeser saat dikunci.
  if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

  scrollLockCount = 1;
}

function releaseScrollLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount !== 0 || !savedScrollStyles) return;

  const html = document.documentElement;
  const body = document.body;
  const saved = savedScrollStyles;
  savedScrollStyles = null;

  html.style.overflow = saved.htmlOverflow;
  html.style.overscrollBehavior = saved.htmlOverscroll;
  body.style.overflow = saved.bodyOverflow;
  body.style.overscrollBehavior = saved.bodyOverscroll;
  body.style.position = saved.bodyPosition;
  body.style.top = saved.bodyTop;
  body.style.left = saved.bodyLeft;
  body.style.right = saved.bodyRight;
  body.style.width = saved.bodyWidth;
  body.style.paddingRight = saved.bodyPaddingRight;

  // Kembalikan posisi scroll halaman yang terakhir terlihat. Untuk mode
  // `position: fixed` ini wajib, kalau tidak halaman "melompat" ke atas.
  if (saved.usesFixedPosition) {
    const restoreX = Math.max(0, saved.scrollX);
    const restoreY = Math.max(0, saved.scrollY);
    if (window.scrollX !== restoreX || window.scrollY !== restoreY) {
      window.scrollTo({ left: restoreX, top: restoreY, behavior: 'instant' as ScrollBehavior });
    }
  }
}

/**
 * Locks background scrolling while an overlay is open.
 * Safe for stacked overlays (slide-over + confirm dialog + Base UI dialog).
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [locked]);
}
