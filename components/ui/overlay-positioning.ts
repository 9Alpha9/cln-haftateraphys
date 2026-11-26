'use client';

import * as React from 'react';

/**
 * Kebijakan positioning terpusat untuk overlay mengambang (DropdownMenu, Popover, AppSelect).
 * Tidak menggantikan floating engine Radix UI / Base UI — hanya menyatukan
 * safe-area viewport, z-index layer, dan responsivitas mobile vs desktop.
 */

/** Tinggi topbar aplikasi (68px) + jarak aman 8px. */
export const TOPBAR_SAFE_AREA_PX = 76;

/** Jarak aman bawah pada mobile (< 768px) agar tidak menabrak bottom navigation. */
export const MOBILE_BOTTOM_NAV_SAFE_AREA_PX = 80;

/** Jarak aman bawah pada tablet/desktop (>= 768px) tanpa bottom navigation. */
export const DESKTOP_BOTTOM_SAFE_AREA_PX = 16;

export const VIEWPORT_EDGE_PADDING_PX = 12;

export const OVERLAY_Z_INDEX = {
  dropdown: 54,
  topbarDropdown: 60,
  popover: 70,
} as const;

export type CollisionPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function getResponsiveCollisionPadding(
  isMobile: boolean,
  top: number = TOPBAR_SAFE_AREA_PX,
): CollisionPadding {
  return {
    top,
    right: VIEWPORT_EDGE_PADDING_PX,
    bottom: isMobile ? MOBILE_BOTTOM_NAV_SAFE_AREA_PX : DESKTOP_BOTTOM_SAFE_AREA_PX,
    left: VIEWPORT_EDGE_PADDING_PX,
  };
}

const MOBILE_MQ = '(max-width: 767px)';

function subscribeMediaQuery(callback: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Mengembalikan collisionPadding yang menyesuaikan viewport mobile vs desktop
 * secara sinkron saat mount (tanpa state flip pasca-render) sehingga desktop
 * tidak terkena padding bottom-nav mobile 80px.
 */
export function useResponsiveCollisionPadding(top: number = TOPBAR_SAFE_AREA_PX): CollisionPadding {
  const isMobile = React.useSyncExternalStore(
    subscribeMediaQuery,
    getMobileSnapshot,
    getServerSnapshot,
  );

  return React.useMemo(() => getResponsiveCollisionPadding(isMobile, top), [isMobile, top]);
}
