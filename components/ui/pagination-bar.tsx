'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, MoreHorizontal } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { cn } from '@/lib/utils';

const controlClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200/90 bg-white text-[#181700]  transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9';

const pageClass =
  'flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-[11px] font-semibold transition-colors sm:h-9 sm:min-w-9 sm:text-xs';

type PaginationBarBaseProps = {
  page: number;
  pageCount: number;
  className?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  pageSizeHrefTemplate?: string;
  onPageSizeChange?: (pageSize: number) => void;
};

type PaginationBarLinkProps = PaginationBarBaseProps & {
  hrefTemplate: string;
  onPageChange?: never;
};

type PaginationBarCallbackProps = PaginationBarBaseProps & {
  onPageChange: (page: number) => void;
  hrefTemplate?: never;
};

export type PaginationBarProps = PaginationBarLinkProps | PaginationBarCallbackProps;

function getPageItems(page: number, pageCount: number): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 3) {
    return [1, 2, 3, 'ellipsis-right', pageCount];
  }
  if (page >= pageCount - 2) {
    return [1, 'ellipsis-left', pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, 'ellipsis-left', page, 'ellipsis-right', pageCount];
}

export function PaginationBar({ page, pageCount, className, ...props }: PaginationBarProps) {
  const router = useRouter();
  const [isChangingSize, startSizeTransition] = useTransition();
  const sizeOptions = props.pageSizeOptions ?? [4, 10, 25, 50];
  const showPageSize =
    typeof props.pageSize === 'number' &&
    sizeOptions.length > 0 &&
    (typeof props.pageSizeHrefTemplate === 'string' || typeof props.onPageSizeChange === 'function');

  if (pageCount <= 1 && !showPageSize) return null;

  const isFirstPage = page <= 1;
  const isLastPage = page >= pageCount;
  const usesLinks = typeof props.hrefTemplate === 'string';
  const items = getPageItems(page, Math.max(1, pageCount));

  const hrefFor = (targetPage: number) => props.hrefTemplate!.replace('{page}', String(targetPage));

  function changePageSize(value: string) {
    const nextSize = Number(value);
    if (!Number.isFinite(nextSize) || nextSize === props.pageSize) return;
    startSizeTransition(() => {
      if (props.onPageSizeChange) {
        props.onPageSizeChange(nextSize);
        if (!usesLinks) props.onPageChange?.(1);
        return;
      }
      if (props.pageSizeHrefTemplate) {
        router.push(props.pageSizeHrefTemplate.replace('{size}', String(nextSize)));
      }
    });
  }

  const firstControl = usesLinks ? (
    <Link
      href={hrefFor(1)}
      aria-label="Halaman pertama"
      aria-disabled={isFirstPage}
      tabIndex={isFirstPage ? -1 : undefined}
      className={cn(controlClass, 'hidden sm:flex', isFirstPage && 'pointer-events-none opacity-30')}
    >
      <ChevronsLeft className="h-4 w-4" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => props.onPageChange!(1)}
      disabled={isFirstPage}
      aria-label="Halaman pertama"
      className={cn(controlClass, 'hidden cursor-pointer sm:flex')}
    >
      <ChevronsLeft className="h-4 w-4" />
    </button>
  );

  const previousControl = usesLinks ? (
    <Link
      href={hrefFor(page - 1)}
      aria-label="Halaman sebelumnya"
      aria-disabled={isFirstPage}
      tabIndex={isFirstPage ? -1 : undefined}
      className={cn(controlClass, isFirstPage && 'pointer-events-none opacity-30')}
    >
      <ChevronLeft className="h-4 w-4" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => props.onPageChange!(page - 1)}
      disabled={isFirstPage}
      aria-label="Halaman sebelumnya"
      className={cn(controlClass, 'cursor-pointer')}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );

  const nextControl = usesLinks ? (
    <Link
      href={hrefFor(page + 1)}
      aria-label="Halaman berikutnya"
      aria-disabled={isLastPage}
      tabIndex={isLastPage ? -1 : undefined}
      className={cn(controlClass, isLastPage && 'pointer-events-none opacity-30')}
    >
      <ChevronRight className="h-4 w-4" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => props.onPageChange!(page + 1)}
      disabled={isLastPage}
      aria-label="Halaman berikutnya"
      className={cn(controlClass, 'cursor-pointer')}
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  );

  const lastControl = usesLinks ? (
    <Link
      href={hrefFor(pageCount)}
      aria-label="Halaman terakhir"
      aria-disabled={isLastPage}
      tabIndex={isLastPage ? -1 : undefined}
      className={cn(controlClass, 'hidden sm:flex', isLastPage && 'pointer-events-none opacity-30')}
    >
      <ChevronsRight className="h-4 w-4" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => props.onPageChange!(pageCount)}
      disabled={isLastPage}
      aria-label="Halaman terakhir"
      className={cn(controlClass, 'hidden cursor-pointer sm:flex')}
    >
      <ChevronsRight className="h-4 w-4" />
    </button>
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'mt-4 border-t border-stone-200/80 px-1 pb-1 pt-3',
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-[11px] text-stone-500 sm:flex-row sm:items-center sm:gap-3 sm:text-xs">
          <span>
            Halaman <span className="font-bold text-[#181700]">{page}</span> dari {pageCount}
          </span>
          {showPageSize ? (
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <span className="whitespace-nowrap">Baris per halaman</span>
              <div className="flex items-center gap-1.5">
                <AppSelect
                  size="compact"
                  align="left"
                  className="w-24 sm:w-32"
                  menuClassName="z-20 min-w-24 p-2.5 sm:min-w-32"
                  value={String(props.pageSize)}
                  onChange={changePageSize}
                  disabled={isChangingSize}
                  aria-label="Baris per halaman"
                  options={sizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
                />
                {isChangingSize ? (
                  <Loader2
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-stone-400"
                    aria-label="Memuat jumlah baris"
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-1 sm:justify-end">
          {firstControl}
          {previousControl}

          {items.map((item) =>
            typeof item === 'number' ? (
              usesLinks ? (
                <Link
                  key={item}
                  href={hrefFor(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    pageClass,
                    item === page
                      ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
                      : 'border-transparent text-stone-500 hover:bg-stone-100 hover:text-[#181700]',
                  )}
                >
                  {item}
                </Link>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => props.onPageChange!(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    pageClass,
                    'cursor-pointer',
                    item === page
                      ? 'border-stone-200 bg-[#F4F4F1] font-bold text-[#181700]'
                      : 'border-transparent text-stone-500 hover:bg-stone-100 hover:text-[#181700]',
                  )}
                >
                  {item}
                </button>
              )
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="flex h-8 w-5 items-center justify-center text-stone-400 sm:h-9 sm:w-6"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ),
          )}

          {nextControl}
          {lastControl}
        </div>
      </div>
    </nav>
  );
}
