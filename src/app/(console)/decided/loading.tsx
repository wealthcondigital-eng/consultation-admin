import { LoadingRegion, Skeleton, SkeletonCard, SkeletonRows } from '@/core/widgets/skeleton';

export default function DecidedLoading() {
  return (
    <LoadingRegion label="Loading decided applications">
      <header className="mb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-8 w-56" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-xl" />

        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28 rounded-[var(--radius-control)]" />
          <Skeleton className="h-10 w-24 rounded-[var(--radius-control)]" />
          <Skeleton className="h-10 w-44 rounded-[var(--radius-control)]" />
        </div>
      </header>

      <SkeletonCard delay={120}>
        <SkeletonRows count={5} />
      </SkeletonCard>
    </LoadingRegion>
  );
}
