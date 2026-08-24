import { LoadingRegion, Skeleton, SkeletonCard } from '@/core/widgets/skeleton';

export default function AuditLoading() {
  return (
    <LoadingRegion label="Loading the audit trail">
      <header className="mb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2.5 h-8 w-60" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-2xl" />

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-32 rounded-[var(--radius-chip)]" />
          ))}
        </div>
      </header>

      <SkeletonCard delay={120}>
        <div className="mb-5 flex items-center gap-3">
          <Skeleton className="size-9 rounded-[var(--radius-control)]" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
        </div>

        <Skeleton className="mb-4 h-3 w-36" />

        <div className="relative space-y-5 pl-8">
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[0.6875rem] w-px bg-divider-faint"
          />
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="animate-rise-sm relative"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <Skeleton className="absolute top-0.5 -left-8 size-6 rounded-full" />
              <Skeleton className="h-4 w-52 max-w-full" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </LoadingRegion>
  );
}
