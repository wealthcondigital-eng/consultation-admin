import {
  LoadingRegion,
  Skeleton,
  SkeletonCard,
  SkeletonRows,
} from '@/core/widgets/skeleton';

export default function QueueLoading() {
  return (
    <LoadingRegion label="Loading the review queue">
      <header className="mb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2.5 h-8 w-72 max-w-full" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl" />

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-36 rounded-[var(--radius-chip)]" />
          ))}
        </div>
      </header>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-11 w-full max-w-sm rounded-[var(--radius-control)]" />
          <Skeleton className="h-11 w-56 rounded-[var(--radius-control)]" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <SkeletonCard delay={100}>
        <SkeletonRows count={6} />
      </SkeletonCard>
    </LoadingRegion>
  );
}
