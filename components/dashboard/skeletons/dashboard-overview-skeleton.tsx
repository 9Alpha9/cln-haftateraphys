import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine, SkeletonPanel } from './skeleton-primitives';

function NotchedCardSkeleton({ accent = false }: { accent?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[26px] border p-5 shadow-sm ${
        accent ? 'border-[var(--hafta-ylw-200)] bg-[var(--hafta-ylw-50)]/60' : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-xl bg-stone-200/80" />
        <SkeletonBlock className="h-6 w-28 rounded-full bg-stone-200/60" />
      </div>
      <SkeletonBlock className="mt-5 h-5 w-2/3 rounded-md bg-stone-200/80" />
      <div className="mt-3 space-y-2">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5 bg-stone-100" />
      </div>
      <SkeletonBlock className="mt-6 h-10 w-36 rounded-full bg-stone-200/70" />
    </div>
  );
}

export function PatientDashboardSkeleton() {
  return (
    <div className="w-full space-y-6">
      <PageHeaderSkeleton action="double" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <section className="grid gap-4 xl:grid-cols-2">
            <NotchedCardSkeleton accent />
            <NotchedCardSkeleton />
          </section>

          <SkeletonPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-44 rounded-md bg-stone-200" />
                <SkeletonLine className="w-64 max-w-full bg-stone-100" />
              </div>
              <SkeletonBlock className="h-4 w-14 rounded-md bg-stone-100" />
            </div>
            <div className="mt-5 divide-y divide-stone-100">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3.5 py-4">
                  <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-[var(--hafta-ylw-50)]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-28 rounded-md bg-stone-200/80" />
                    <SkeletonLine className="w-56 max-w-full bg-stone-100" />
                  </div>
                  <SkeletonBlock className="h-4 w-4 rounded-md bg-stone-100" />
                </div>
              ))}
            </div>
          </SkeletonPanel>
        </div>

        <aside className="min-w-0 lg:col-span-4">
          <SkeletonPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <SkeletonLine className="w-24 bg-stone-100" />
                <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
              </div>
              <SkeletonBlock className="h-9 w-9 rounded-full bg-stone-100" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-2xl bg-stone-100 p-1.5">
              {[0, 1, 2].map((item) => (
                <SkeletonBlock key={item} className="h-8 rounded-xl bg-white/70" />
              ))}
            </div>
            <div className="mt-7 flex justify-center">
              <SkeletonBlock className="h-40 w-40 rounded-full bg-stone-100" />
            </div>
            <div className="mt-7 space-y-3">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-5/6" />
              <SkeletonLine className="w-2/3 bg-stone-100" />
            </div>
          </SkeletonPanel>
        </aside>
      </div>
    </div>
  );
}

export function StaffDashboardSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <header className="border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2.5">
              <SkeletonBlock className="h-9 w-64 max-w-full rounded-lg bg-stone-200" />
              <SkeletonLine className="w-96 max-w-full" />
              <SkeletonLine className="w-72 max-w-full bg-stone-100" />
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-3 border-t border-stone-100 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {[0, 1].map((item) => (
                <div key={item} className="space-y-2">
                  <SkeletonLine className="w-24 bg-stone-100" />
                  <SkeletonBlock className="h-6 w-10 rounded-md bg-stone-200" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonPanel key={item} className="h-32 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-9 w-9 rounded-xl bg-stone-100" />
                <SkeletonBlock className="h-5 w-14 rounded-full bg-stone-100" />
              </div>
              <SkeletonBlock className="mt-4 h-6 w-20 rounded-md bg-stone-200" />
              <SkeletonLine className="mt-2 w-28 bg-stone-100" />
            </SkeletonPanel>
          ))}
        </div>

        <SkeletonPanel className="h-72 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-48 rounded-md bg-stone-200" />
            <SkeletonBlock className="h-8 w-28 rounded-full bg-stone-100" />
          </div>
          <div className="mt-5 flex h-40 items-end gap-3">
            {[40, 58, 36, 70, 52, 82, 64, 48, 76, 60, 88, 54].map((height, index) => (
              <SkeletonBlock key={index} className="flex-1 rounded-t-md bg-stone-100" style={{ height: `${height}%` }} />
            ))}
          </div>
        </SkeletonPanel>

        <SkeletonPanel className="rounded-2xl">
          <div className="border-b border-stone-100 p-5">
            <SkeletonBlock className="h-5 w-44 rounded-md bg-stone-200" />
          </div>
          <div className="divide-y divide-stone-100">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 p-5">
                <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-stone-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-48 max-w-full rounded-md bg-stone-200/80" />
                  <SkeletonLine className="w-64 max-w-full bg-stone-100" />
                </div>
                <SkeletonBlock className="h-8 w-20 rounded-full bg-stone-100" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-5 self-start xl:w-[330px]">
        <SkeletonBlock className="h-12 w-full rounded-2xl bg-stone-200" />
        <SkeletonPanel className="p-5">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
            <SkeletonBlock className="h-8 w-8 rounded-full bg-stone-100" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-8 flex-1 rounded-xl bg-stone-100" />
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex gap-3">
                <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full bg-stone-100" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-2/3 bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </aside>
    </div>
  );
}
