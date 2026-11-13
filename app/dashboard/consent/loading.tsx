import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';

export default function ConsentLoading() {
  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <div className="border-b border-stone-200/90 pb-5 pt-4">
        <SkeletonBlock className="h-3 w-40 bg-stone-100" />
        <SkeletonBlock className="mt-3 h-7 w-56 bg-stone-200" />
        <SkeletonLine className="mt-2 w-full max-w-lg" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <SkeletonBlock className="h-4 w-40 bg-stone-200/80" />
          {[0, 1].map((card) => (
            <SkeletonPanel key={card} className="rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full space-y-2">
                  <SkeletonBlock className="h-4 w-52 max-w-full bg-stone-200/80" />
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-3/4 bg-stone-100" />
                </div>
                <SkeletonBlock className="h-9 w-20 shrink-0 rounded-full bg-stone-100" />
              </div>
            </SkeletonPanel>
          ))}
        </div>
      ))}
    </div>
  );
}
