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

export function useOverlayLayer(isOpen: boolean) {
  const id = useId();
  const currentRevision = useSyncExternalStore(subscribe, getRevision, () => 0);
  void currentRevision;

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    register(id);
    return () => unregister(id);
  }, [id, isOpen]);

  const index = openOverlays.indexOf(id);
  const isTopmost = index >= 0 && index === openOverlays.length - 1;
  const zIndex = 40 + Math.max(index, 0) * 2;

  return { isTopmost, zIndex };
}
