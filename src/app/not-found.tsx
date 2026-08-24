import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4">
      {/* The same drifting wash the console shell uses, so a wrong URL still
          looks like part of this app rather than like a server error page. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute top-1/4 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary-soft/10 blur-3xl" />
      </div>

      <div className="animate-rise relative max-w-sm text-center">
        <p className="text-meta-label">404</p>
        <h1 className="text-screen-title mt-2">Nothing here</h1>
        <p className="text-card-subtitle mt-2 leading-relaxed">
          That application either never existed or is not one you have access to.
        </p>
        <Link
          href="/queue"
          className="press group mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgb(30_64_175/0.2)] hover:bg-primary-deep hover:shadow-[0_4px_14px_rgb(30_64_175/0.3)]"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Back to the queue
        </Link>
      </div>
    </main>
  );
}
