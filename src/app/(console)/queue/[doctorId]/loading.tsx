import { LoadingRegion, Skeleton, SkeletonCard } from '@/core/widgets/skeleton';

export default function ApplicationLoading() {
  return (
    <LoadingRegion label="Loading the application">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* The applicant card, down to the strip of document segments along its
          foot — the shape the real header lands in. */}
      <div className="animate-rise-sm mb-5 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex min-w-0 gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="min-w-0">
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="mt-2.5 h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          </div>
          <div className="hidden shrink-0 items-end sm:flex sm:flex-col">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-divider-faint bg-surface-muted px-5 py-3.5">
          <Skeleton className="h-1.5 w-10 rounded-full" />
          <Skeleton className="h-1.5 w-10 rounded-full" />
          <Skeleton className="h-1.5 w-10 rounded-full" />
          <Skeleton className="ml-2 h-3 w-48 max-w-[40%]" />
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <SkeletonCard delay={80}>
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="size-9 rounded-[var(--radius-control)]" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-72 max-w-full" />
              </div>
            </div>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex gap-4 border-b border-divider-faint py-3">
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </SkeletonCard>

          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} delay={140 + index * 60}>
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-[var(--radius-control)]" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-52 max-w-full" />
                  <Skeleton className="mt-2 h-3 w-64 max-w-full" />
                </div>
                <Skeleton className="h-9 w-32 shrink-0 rounded-[var(--radius-control)]" />
              </div>
            </SkeletonCard>
          ))}
        </div>

        <aside className="space-y-5">
          <SkeletonCard delay={120}>
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="size-9 rounded-[var(--radius-control)]" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="mt-4 h-16 w-full rounded-[var(--radius-control)]" />
            <Skeleton className="mt-4 h-11 w-full rounded-[var(--radius-control)]" />
            <Skeleton className="mt-4 h-24 w-full rounded-[var(--radius-control)]" />
          </SkeletonCard>
        </aside>
      </div>
    </LoadingRegion>
  );
}
