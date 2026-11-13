import {
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
} from '@/components/dashboard/skeletons/skeleton-primitives';

export default function DocumentsLoading() {
  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <div className="border-b border-stone-200/90 pb-5 pt-4">
        <SkeletonBlock className="h-3 w-36 bg-stone-100" />
        <SkeletonBlock className="mt-3 h-7 w-40 bg-stone-200" />
        <SkeletonLine className="mt-2 w-full max-w-lg" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SkeletonBlock className="h-10 flex-1 rounded-full bg-stone-100" />
        <SkeletonBlock className="h-10 w-full rounded-full bg-stone-100 sm:w-52" />
        <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" />
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="rounded-2xl p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl bg-stone-100" />
              <div className="w-full space-y-2">
                <SkeletonBlock className="h-4 w-60 max-w-full bg-stone-200/80" />
                <SkeletonLine className="w-72 max-w-full" />
              </div>
              <SkeletonBlock className="hidden h-9 w-24 shrink-0 rounded-full bg-stone-100 sm:block" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}
