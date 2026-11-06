'use client';

import { useEffect } from 'react';

let scrollLockCount = 0;
let savedScrollStyles:
  | {
      htmlOverflow: string;
      bodyOverflow: string;
      htmlOverscroll: string;
      bodyOverscroll: string;
      bodyPaddingRight: string;
    }
  | null = null;

function acquireScrollLock() {
  const html = document.documentElement;
  const body = document.body;

  if (scrollLockCount === 0) {
    savedScrollStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollBarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
  }

  scrollLockCount += 1;
}

function releaseScrollLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount !== 0 || !savedScrollStyles) return;

  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = savedScrollStyles.htmlOverflow;
  body.style.overflow = savedScrollStyles.bodyOverflow;
  html.style.overscrollBehavior = savedScrollStyles.htmlOverscroll;
  body.style.overscrollBehavior = savedScrollStyles.bodyOverscroll;
  body.style.paddingRight = savedScrollStyles.bodyPaddingRight;
  savedScrollStyles = null;
}

/**
 * Locks background scrolling while an overlay is open.
 * Safe for stacked overlays (slide-over + confirm dialog).
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [locked]);
}
