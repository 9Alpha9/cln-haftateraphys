'use client';

import { useBaseUiScrollLock } from '@/components/ui/use-base-ui-scroll-lock';

/**
 * Menjaga scroll lock body tetap sinkron dengan popup Base UI (Dialog/Sheet)
 * yang dibuka dari halaman mana pun. Tidak merender elemen apa pun.
 */
export function BaseUiScrollLock() {
  useBaseUiScrollLock();
  return null;
}
