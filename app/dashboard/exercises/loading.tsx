import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';

export default function ExercisesLoading() {
  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <div className="border-b border-stone-200/90 pb-5 pt-4">
        <SkeletonBlock className="h-3 w-40 bg-stone-100" />
        <SkeletonBlock className="mt-3 h-7 w-48 bg-stone-200" />
        <SkeletonLine className="mt-2 w-full max-w-lg" />
      </div>
      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-full space-y-2">
            <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
            <SkeletonBlock className="h-5 w-56 max-w-full bg-stone-200/70" />
            <SkeletonLine className="w-40 bg-stone-100" />
          </div>
          <SkeletonBlock className="h-7 w-20 shrink-0 rounded-full bg-stone-100" />
        </div>
        <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl bg-stone-100" />
      </SkeletonPanel>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-32 bg-stone-200/80" />
        {[0, 1, 2].map((item) => (
          <SkeletonPanel key={item} className="rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl bg-stone-100" />
              <div className="w-full space-y-2">
                <SkeletonBlock className="h-4 w-44 max-w-full bg-stone-200/70" />
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-3/4 bg-stone-100" />
              </div>
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}
