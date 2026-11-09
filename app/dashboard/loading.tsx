import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';

export default function DashboardLoading() {
  return (
    <div className="space-y-4 pt-3 sm:space-y-5 sm:pt-4" aria-busy="true" aria-label="Memuat dashboard">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-36 rounded-full bg-stone-100" />
        <SkeletonBlock className="h-8 w-44 rounded-lg bg-stone-200" />
        <SkeletonLine className="w-64 max-w-full" />
      </div>

      <div className="flex gap-3 overflow-hidden py-1 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel
            key={item}
            className="flex min-h-44 min-w-[220px] shrink-0 flex-col p-4 sm:min-w-0"
          >
            <SkeletonBlock className="h-3 w-20 bg-stone-200/80" />
            <SkeletonBlock className="mt-3 h-6 w-32 bg-stone-200/70" />
            <SkeletonLine className="mt-3 w-full" />
            <SkeletonLine className="mt-1.5 w-2/3" />
            <SkeletonBlock className="mt-4 h-9 w-full rounded-full bg-stone-100" />
          </SkeletonPanel>
        ))}
      </div>

      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
        <SkeletonBlock className="h-3 w-20 bg-stone-200/80" />
        <SkeletonBlock className="mt-2 h-5 w-40 bg-stone-200/70" />
        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-xl bg-stone-100" />
          ))}
        </div>
      </SkeletonPanel>

      <div className="grid gap-4 lg:grid-cols-12">
        <SkeletonPanel className="h-56 rounded-3xl p-4 sm:p-5 lg:col-span-8">
          <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
          <SkeletonBlock className="mt-2 h-5 w-48 bg-stone-200/70" />
          <SkeletonLine className="mt-4 w-full" />
          <SkeletonLine className="mt-2 w-4/5" />
        </SkeletonPanel>
        <SkeletonPanel className="h-56 rounded-3xl p-4 sm:p-5 lg:col-span-4">
          <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-14 rounded-2xl bg-stone-100" />
            ))}
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}
