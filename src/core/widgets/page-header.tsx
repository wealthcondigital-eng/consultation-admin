import type { ReactNode } from 'react';

/// The top of every screen in the console, in one place.
///
/// The first pass wrote a header by hand on each page, and they drifted: three
/// different margins, two different sub-line colours, and the queue's count of
/// "how many are ready" buried in a sentence where the overview put the same
/// kind of figure in a tile. A reviewer moving between screens should not have
/// to re-learn where the title is.
///
/// `eyebrow` carries the section name so the title itself can be short —
/// "Review queue / 14 waiting" reads better as two lines of different weight
/// than as one long heading.
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  readonly eyebrow?: string;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly actions?: ReactNode;
  /// Chips, tabs, or anything else that belongs to the header rather than to
  /// the content under it.
  readonly children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-meta-label animate-fade mb-1">{eyebrow}</p>
          ) : null}
          <h1
            className="text-screen-title animate-rise-sm text-balance"
            style={{ animationDelay: '40ms' }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="text-card-subtitle animate-rise-sm mt-1.5 max-w-2xl leading-relaxed"
              style={{ animationDelay: '90ms' }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div
            className="animate-rise-sm flex shrink-0 flex-wrap items-center gap-2"
            style={{ animationDelay: '120ms' }}
          >
            {actions}
          </div>
        ) : null}
      </div>

      {children ? (
        <div className="animate-rise-sm mt-4" style={{ animationDelay: '150ms' }}>
          {children}
        </div>
      ) : null}
    </header>
  );
}

/// A small figure with a word beside it, for the row under a page title.
///
/// Not a `StatTile`: a tile is a destination, this is a caption. Used where a
/// count qualifies the heading — "9 waiting · 3 ready · 2 returned" — and would
/// be four unread words if it were written as a sentence.
export function HeaderStat({
  value,
  label,
  tone = 'neutral',
  delay = 0,
}: {
  readonly value: string | number;
  readonly label: string;
  readonly tone?: 'neutral' | 'info' | 'positive' | 'caution' | 'negative';
  readonly delay?: number;
}) {
  const TONES = {
    neutral: 'text-text-primary',
    info: 'text-primary-deep',
    positive: 'text-success',
    caution: 'text-warning',
    negative: 'text-danger',
  } as const;

  const DOTS = {
    neutral: 'bg-text-tertiary',
    info: 'bg-primary-vivid',
    positive: 'bg-success-strong',
    caution: 'bg-warning',
    negative: 'bg-danger',
  } as const;

  return (
    <span
      className="animate-rise-sm inline-flex items-center gap-2 rounded-[var(--radius-chip)] border border-border bg-surface/70 px-2.5 py-1.5 text-[0.8125rem] shadow-[var(--shadow-card)] backdrop-blur"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${DOTS[tone]}`} />
      <span className={`tabular font-bold ${TONES[tone]}`}>{value}</span>
      <span className="text-text-secondary">{label}</span>
    </span>
  );
}
