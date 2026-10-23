'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FolderTab {
  id: string;
  label: string;
  count?: number;
}

export interface FolderMetricItem {
  label: string;
  value: string | number;
  percentage: number;
  barStyle: 'tick' | 'solid' | 'accent';
}

export interface FolderSummaryTag {
  label: string;
  count: number;
}

export interface FolderActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  kind: string;
  href?: string;
}

export interface FolderTabPanelProps {
  tabs: FolderTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  // Header ringkasan utama
  totalValue: string | number;
  totalLabel: string;
  context?: string;
  // Sub-card ringkasan
  summaryVisible?: boolean;
  summaryTitle?: string;
  summaryTags?: FolderSummaryTag[];
  metrics?: FolderMetricItem[];
  // Daftar aktivitas
  listTitle?: string;
  listActionHref?: string;
  listActionLabel?: string;
  items: FolderActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export function FolderTabPanel({
  tabs,
  activeTabId,
  onTabChange,
  totalValue,
  totalLabel,
  context,
  summaryVisible = true,
  summaryTitle = 'Ringkasan Aktivitas',
  summaryTags = [],
  metrics = [],
  items = [],
  listTitle = 'Tindakan Klinis Terbaru',
  listActionHref,
  listActionLabel = 'Rekam Medis',
  emptyMessage = 'Belum ada aktivitas pada kategori ini.',
  className,
}: FolderTabPanelProps) {
  const uid = React.useId().replace(/:/g, '');
  const hatchId = `activity-hatch-${uid}`;
  const clipId = `activity-hatch-clip-${uid}`;

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-stone-200 bg-white', className)}>
      {/* ── TRUE FOLDER TABS ── */}
      <div
        role="tablist"
        className="grid grid-cols-3 items-end gap-0.5 bg-stone-200/60 px-1.5 pt-2 sm:gap-1 sm:px-3"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex min-w-0 items-center justify-center gap-1 px-1.5 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer select-none sm:gap-1.5 sm:px-2.5 sm:text-xs',
                isActive
                  ? 'z-10 rounded-t-[24px] bg-white text-[#181700]'
                  : 'rounded-t-[20px] bg-stone-100/90 text-stone-600 hover:bg-stone-200/60'
              )}
            >
              {isActive && (
                <>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-2 bottom-0 h-2 w-2"
                    style={{
                      background:
                        'radial-gradient(circle at 0 0, transparent 0, transparent 7px, #ffffff 7.5px)',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 bottom-0 h-2 w-2"
                    style={{
                      background:
                        'radial-gradient(circle at 100% 0, transparent 0, transparent 7px, #ffffff 7.5px)',
                    }}
                  />
                </>
              )}
              <span className="min-w-0 truncate">{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isActive
                      ? 'bg-[#181700] text-white'
                      : 'border border-stone-300 bg-white font-medium text-[#181700]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── BADAN KARTU ── */}
      <div className="bg-white p-4 sm:p-5">
        {/* Header utama */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-[#181700] sm:text-[26px]">
              {totalValue}
              <sup className="ml-1 align-super text-[10px] font-semibold tracking-[0.14em] text-stone-400">
                {totalLabel}
              </sup>
            </p>
            {context ? (
              <p className="mt-1 text-xs leading-relaxed text-stone-400">{context}</p>
            ) : null}
          </div>

          {listActionHref ? (
            <Link
              href={listActionHref}
              className="shrink-0 rounded-full border border-stone-200/90 bg-white px-4 py-2 text-xs font-semibold text-[#181700] transition-all hover:bg-[var(--hafta-ylw-100)]"
            >
              {listActionLabel}
            </Link>
          ) : null}
        </div>

        {/* Sub-card ringkasan */}
        {summaryVisible && (
          <div className="mt-5 rounded-3xl bg-[#F7F7F5] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold tracking-normal text-[#181700] sm:text-base">
                {summaryTitle}
              </h3>
              {listActionHref ? (
                <Link
                  href={listActionHref}
                  aria-label={listActionLabel}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-100)]"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            <div className="my-5 grid grid-cols-12 items-center gap-3">
              {/* Tag pill real — strict left column */}
              <div className="col-span-7 flex min-w-0 flex-col gap-2 pr-1">
                {summaryTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag.label}
                    className="flex w-full max-w-[175px] items-center justify-between gap-2 rounded-full bg-[#EFEFED] px-3 py-1.5 text-[11px] font-medium text-stone-700"
                  >
                    <span className="min-w-0 truncate">{tag.label}</span>
                    <span className="shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-600">
                      {tag.count}
                    </span>
                  </span>
                ))}
              </div>

              {/* Architectural circle dengan arsiran diagonal — strict right column */}
              <div className="col-span-5 flex min-w-0 items-center justify-center">
                <div className="relative flex aspect-square w-full max-w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200/80 bg-white shadow-2xs sm:max-w-32">
                <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                  <defs>
                    <pattern
                      id={hatchId}
                      width="6"
                      height="6"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#d6d3d1" strokeWidth="1" />
                    </pattern>
                    <clipPath id={clipId}>
                      <rect x="0" y="0" width="50" height="100" />
                    </clipPath>
                  </defs>
                  <circle cx="50" cy="50" r="48" fill="#FFFFFF" />
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill={`url(#${hatchId})`}
                    clipPath={`url(#${clipId})`}
                  />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold leading-none text-[#181700] sm:text-2xl">
                    {totalValue}
                  </span>
                  <span className="ml-1 -translate-y-1 text-[9px] font-medium leading-none text-stone-500 sm:text-[11px]">
                    Aktivitas
                  </span>
                </div>
                </div>
              </div>
            </div>

            {/* 3 kolom metrik */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {metrics.map((metric) => {
                  const width = Math.min(100, Math.max(0, metric.percentage));
                  return (
                    <div key={metric.label} className="min-w-0">
                      <p className="truncate text-base font-bold leading-none text-[#181700] sm:text-lg">
                        {metric.value}
                      </p>
                      <p className="mb-2.5 mt-1 text-[10px] leading-tight text-stone-500 sm:text-[11px]">
                        {metric.label}
                      </p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            metric.barStyle === 'solid'
                              ? 'bg-[#181700]'
                              : metric.barStyle === 'accent'
                                ? 'bg-[var(--hafta-ylw-100)]'
                                : ''
                          )}
                          style={{
                            width: `${width}%`,
                            ...(metric.barStyle === 'tick'
                              ? {
                                  backgroundImage:
                                    'repeating-linear-gradient(90deg, #57534e 0px, #57534e 1.5px, transparent 1.5px, transparent 4px)',
                                }
                              : {}),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Daftar tindakan */}
        <div className="mt-5 rounded-3xl bg-[#F7F7F5] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#181700]">{listTitle}</h3>
            {listActionHref ? (
              <Link
                href={listActionHref}
                aria-label={listActionLabel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#181700] shadow-2xs transition-colors hover:bg-[var(--hafta-ylw-100)]"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">{emptyMessage}</div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFEFED] text-xs font-semibold text-stone-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-[12px] font-bold leading-tight text-[#181700]">
                        {item.title}
                      </p>
                      <p className="break-words text-xs text-stone-400 pt-1">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="w-24 shrink-0 text-right">
                    <div className="mb-1 ml-auto flex w-16 items-center gap-1">
                      <span className="h-1 w-5 rounded-full bg-[var(--hafta-ylw-100)]" />
                      <span className="h-0.5 flex-1 border-b-2 border-dotted border-stone-400" />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] font-bold leading-none text-[#181700] sm:text-xs">
                        {item.time}
                      </span>
                      <span className="text-[10px] font-medium capitalize text-stone-400">
                        {item.kind}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
