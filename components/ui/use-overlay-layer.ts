'use client';

import { useEffect, useId, useLayoutEffect, useSyncExternalStore } from 'react';

let openOverlays: string[] = [];
let revision = 0;
const listeners = new Set<() => void>();

function notify() {
  revision += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getRevision() {
  return revision;
}

function register(id: string) {
  if (openOverlays[openOverlays.length - 1] === id) return;
  openOverlays = [...openOverlays.filter((item) => item !== id), id];
  notify();
}

function unregister(id: string) {
  if (!openOverlays.includes(id)) return;
  openOverlays = openOverlays.filter((item) => item !== id);
  notify();
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useOverlayLayer(isOpen: boolean, baseZIndex = 60) {
  const id = useId();
  const currentRevision = useSyncExternalStore(subscribe, getRevision, () => 0);
  void currentRevision;

  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      register(id);
      return;
    }
    // Keep the layer registered briefly so the exit animation stays above
    // headers/dropdowns instead of dropping to the base z-index mid-close.
    const timer = window.setTimeout(() => unregister(id), 450);
    return () => window.clearTimeout(timer);
  }, [id, isOpen]);

  useIsomorphicLayoutEffect(() => () => unregister(id), [id]);

  const index = openOverlays.indexOf(id);
  const isTopmost = index >= 0 && index === openOverlays.length - 1;
  const zIndex = baseZIndex + Math.max(index, 0) * 2;

  return { isTopmost, zIndex };
}
