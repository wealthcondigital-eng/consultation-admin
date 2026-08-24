/// Placeholder blocks shown while a screen's data is in flight.
///
/// Every page here is a dynamic server component, so navigating means waiting on
/// the API before any markup arrives. Without a `loading.tsx` the reviewer gets
/// a frozen previous screen and no signal that anything is happening — which on
/// a slow connection reads as a broken click. These are shaped like the real
/// layout so the page does not jump when the data lands.
///
/// The sheen travelling across each block does the work a pulse cannot: a
/// pulsing rectangle says "this element is decorative", a rectangle with light
/// moving left-to-right across it says "this element is filling in". The two
/// look similar in a screenshot and read completely differently in motion.
export function Skeleton({ className = '' }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`sheen relative overflow-hidden rounded bg-divider-faint ${className}`}
    />
  );
}

export function SkeletonCard({
  children,
  delay = 0,
}: {
  readonly children?: React.ReactNode;
  readonly delay?: number;
}) {
  return (
    <div
      className="animate-rise-sm rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/// Announces the wait to a screen reader, which cannot see a shimmering
/// rectangle.
export function LoadingRegion({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonRows({ count = 6 }: { readonly count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-rise-sm flex items-center gap-4"
          style={{ animationDelay: `${index * 45}ms` }}
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-28 md:block" />
          <Skeleton className="ml-auto h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
