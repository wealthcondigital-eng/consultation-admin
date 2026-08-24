import { BrandMark } from '@/core/widgets/brand-mark';

/// The opening frame, as pure markup.
///
/// Split out from `SplashScreen` because there are now two things that show it
/// and they behave differently: the root gate shows it *while navigating
/// somewhere else*, and the sign-in page shows it *over content already on the
/// page*. Only the behaviour differs, so only the behaviour is duplicated —
/// there is one copy of what the thing actually looks like, and a change to the
/// mark or the wording lands in both places at once.
export function SplashVisual({
  status,
  durationMs,
}: {
  /// The line under the bar. The caller owns it because the two callers are
  /// saying genuinely different things — one is checking a session, the other
  /// is opening a form.
  readonly status: string;
  /// Times the progress bar to whatever the caller is actually waiting for, so
  /// the bar finishes as the screen leaves rather than looping meaninglessly.
  readonly durationMs: number;
}) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-primary-deep px-6 text-white">
      {/* Two slow washes of colour, drifting on a long cycle. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-drift absolute -top-32 -left-24 size-[36rem] rounded-full bg-primary-soft/40 blur-3xl" />
        <div
          className="animate-drift absolute -right-32 -bottom-40 size-[32rem] rounded-full bg-primary/30 blur-3xl"
          style={{ animationDelay: '-9s' }}
        />
      </div>

      {/* A faint engineering grid. It is what stops the panel reading as a
          consumer product's launch screen: this is a tool, and the grid says so
          without a word of copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 15%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 15%, transparent 72%)',
        }}
      />

      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        {/* The mark, with two rings leaving it. Staggered so it reads as a
            pulse travelling outwards rather than as a circle blinking. */}
        <div className="relative mb-7 grid place-items-center">
          <span
            aria-hidden="true"
            className="absolute size-20 animate-ping rounded-[var(--radius-card)] bg-white/10"
            style={{ animationDuration: '2.6s' }}
          />
          <span
            aria-hidden="true"
            className="absolute size-24 animate-ping rounded-[var(--radius-card)] bg-white/5"
            style={{ animationDuration: '2.6s', animationDelay: '0.5s' }}
          />
          <span className="animate-scale-in relative">
            <BrandMark size="lg" onDark />
          </span>
        </div>

        <p className="text-brand-title animate-rise" style={{ animationDelay: '90ms' }}>
          Doctor Approvals
        </p>
        <p
          className="animate-rise mt-1.5 text-sm text-white/60"
          style={{ animationDelay: '150ms' }}
        >
          Credentialing console
        </p>

        <div
          className="animate-fade mt-9 h-1 w-full overflow-hidden rounded-full bg-white/15"
          style={{ animationDelay: '200ms' }}
          role="progressbar"
          aria-label="Opening the console"
        >
          <div
            className="animate-grow-x h-full origin-left rounded-full bg-white/85"
            style={{
              animationDuration: `${durationMs}ms`,
              animationTimingFunction: 'ease-in-out',
            }}
          />
        </div>

        <p
          aria-live="polite"
          className="mt-3 min-h-[1.25rem] text-xs font-medium tracking-wide text-white/55"
        >
          {status}
        </p>
      </div>

      <p className="absolute bottom-6 text-[0.6875rem] text-white/35">
        Internal tool · access is logged
      </p>
    </div>
  );
}
