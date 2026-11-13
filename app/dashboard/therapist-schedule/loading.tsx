import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';

export default function TherapistScheduleLoading() {
  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <div className="border-b border-stone-200/90 pb-5 pt-4">
        <SkeletonBlock className="h-3 w-40 bg-stone-100" />
        <SkeletonBlock className="mt-3 h-7 w-44 bg-stone-200" />
        <SkeletonLine className="mt-2 w-full max-w-lg" />
      </div>

      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
        <SkeletonBlock className="h-4 w-32 bg-stone-200/80" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#FAFAF8] p-3">
              <SkeletonBlock className="h-4 w-16 bg-stone-200/70" />
              <SkeletonBlock className="h-9 flex-1 rounded-xl bg-stone-100" />
              <SkeletonBlock className="h-9 w-9 rounded-full bg-stone-100" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="mt-4 h-10 w-32 rounded-full bg-stone-200/80" />
      </SkeletonPanel>

      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
        <SkeletonBlock className="h-4 w-40 bg-stone-200/80" />
        <SkeletonLine className="mt-2 w-64 max-w-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-10 rounded-xl bg-stone-100" />
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}
