import { LoadingRegion, Skeleton, SkeletonCard } from '@/core/widgets/skeleton';

/// The overview had no `loading.tsx` at all, which on a dynamic route meant a
/// click on "Overview" left the previous screen frozen until the API answered.
/// Shaped like the real thing — a header, four tiles, two panels — so the page
/// fills in rather than replacing itself.
export default function OverviewLoading() {
  return (
    <LoadingRegion label="Loading the overview">
      <header className="mb-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-2.5 h-8 w-64" />
        <Skeleton className="mt-2.5 h-4 w-96 max-w-full" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} delay={index * 60}>
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-8 rounded-[var(--radius-chip)]" />
            </div>
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </SkeletonCard>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, card) => (
          <SkeletonCard key={card} delay={240 + card * 60}>
            <div className="mb-5 flex items-center gap-3">
              <Skeleton className="size-9 rounded-[var(--radius-control)]" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-52 max-w-full" />
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-40 max-w-full" />
                    <Skeleton className="mt-2 h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-14 shrink-0" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </LoadingRegion>
  );
}
