'use client';

import { useEffect, useState } from 'react';

import { useBodyScrollLock } from '@/components/ui/use-body-scroll-lock';

/**
 * Scroll lock untuk popup Base UI (`Dialog`/`Sheet` di `components/ui/dialog.tsx`
 * dan `components/ui/sheet.tsx`).
 *
 * Popup tersebut dirender oleh library, jadi hook ini dipasang sekali di layout
 * root dan mengunci body berdasarkan keberadaan popup Base UI yang sedang
 * terbuka di DOM. Hasilnya satu mekanisme scroll lock yang sama untuk seluruh
 * overlay aplikasi (drawer custom maupun dialog library).
 */
const BASE_UI_MODAL_SELECTOR =
  '[data-slot="dialog-content"][data-open], [data-slot="sheet-content"][data-open]';

export function useBaseUiScrollLock() {
  const [locked, setLocked] = useState(
    () => typeof document !== 'undefined' && document.querySelector(BASE_UI_MODAL_SELECTOR) !== null,
  );

  useEffect(() => {
    const sync = () => setLocked(document.querySelector(BASE_UI_MODAL_SELECTOR) !== null);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-open'],
    });
    return () => observer.disconnect();
  }, []);

  useBodyScrollLock(locked);
}
