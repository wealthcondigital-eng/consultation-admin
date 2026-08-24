import Link from 'next/link';
import type { ReactNode } from 'react';

import { CountUp } from '@/core/widgets/count-up';
import { LinkProgress } from '@/core/widgets/link-progress';

/// One number on the overview, with a word for what it counts.
///
/// The number is the largest thing in the tile and the label sits above it, so
/// the row scans as four figures rather than as four sentences. `tone` colours
/// the figure and its glyph only — a tinted card for every tile would make none
/// of them stand out.
///
/// Three additions over the first pass, each earning its keep:
///
///  * the figure **counts up** on arrival, so the eye lands on it rather than
///    sliding past four equally static numerals;
///  * a **meter** underneath, where the number means something as a share of a
///    whole — "9 of 14 waiting" is a fact a bare 9 cannot state;
///  * the whole tile **lifts** when it is a link, which is the only honest way
///    to advertise that three of the four are clickable and one is not.
type Tone = 'neutral' | 'info' | 'positive' | 'negative' | 'caution';

const VALUE_TONES: Record<Tone, string> = {
  neutral: 'text-text-primary',
  info: 'text-primary-deep',
  positive: 'text-success',
  negative: 'text-danger',
  caution: 'text-warning',
};

const GLYPH_TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-text-tertiary',
  info: 'bg-primary-surface text-primary-vivid',
  positive: 'bg-badge-surface text-success',
  negative: 'bg-danger-surface text-danger',
  caution: 'bg-warning-surface text-warning',
};

const METER_TONES: Record<Tone, string> = {
  neutral: 'bg-text-tertiary',
  info: 'bg-primary-vivid',
  positive: 'bg-success-strong',
  negative: 'bg-danger',
  caution: 'bg-warning',
};

export function StatTile({
  label,
  value,
  suffix,
  hint,
  tone = 'neutral',
  href,
  icon,
  meter,
  delay = 0,
}: {
  readonly label: string;
  readonly value: number;
  /// Rendered hard against the figure — `d` for days, `%`. Kept out of `value`
  /// so the count-up can animate the number without the unit flickering.
  readonly suffix?: string;
  readonly hint?: string;
  readonly tone?: Tone;
  readonly href?: string;
  readonly icon?: ReactNode;
  readonly meter?: { readonly value: number; readonly max: number; readonly label?: string };
  readonly delay?: number;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-meta-label">{label}</p>
        {icon ? (
          <span
            aria-hidden="true"
            className={`grid size-8 shrink-0 place-items-center rounded-[var(--radius-chip)] transition-transform duration-300 group-hover:scale-110 ${GLYPH_TONES[tone]}`}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p
        className={`tabular mt-2 flex items-baseline gap-0.5 text-3xl font-extrabold tracking-tight ${VALUE_TONES[tone]}`}
      >
        <CountUp value={value} />
        {suffix ? <span className="text-xl font-bold opacity-70">{suffix}</span> : null}
      </p>

      {/* The hint sits directly under the figure and the meter goes to the foot
          of the tile. The other way round, a single tile carrying a meter
          knocks its own hint line out of step with the three beside it, and a
          row of tiles whose captions do not align reads as four unrelated
          boxes rather than as one row. */}
      <p className="text-helper mt-1 flex min-h-[1.125rem] items-center gap-1">
        {hint ?? ''}
        {href ? (
          <span
            aria-hidden="true"
            className="inline-block opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
          >
            →
          </span>
        ) : null}
      </p>

      {meter ? (
        <div className="mt-auto pt-3">
          <Meter {...meter} tone={tone} />
        </div>
      ) : null}
    </>
  );

  const shell =
    'animate-rise group flex flex-col rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]';
  const style = delay ? { animationDelay: `${delay}ms` } : undefined;

  if (!href) {
    return (
      <div className={shell} style={style}>
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={`${shell} lift hover:border-primary-soft/70`} style={style}>
      <LinkProgress />
      {body}
    </Link>
  );
}

/// The bar draws itself from empty on arrival. It is `scaleX` on a
/// transform-origin rather than an animated `width` so it stays on the
/// compositor and does not re-lay-out the tile sixty times a second.
function Meter({
  value,
  max,
  label,
  tone,
}: {
  readonly value: number;
  readonly max: number;
  readonly label?: string;
  readonly tone: Tone;
}) {
  const fraction = max <= 0 ? 0 : Math.min(value / max, 1);

  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-divider-faint"
        role="img"
        aria-label={label ?? `${value} of ${max}`}
      >
        <div
          className={`animate-grow-x h-full origin-left rounded-full ${METER_TONES[tone]}`}
          style={{ width: `${fraction * 100}%`, animationDelay: '220ms' }}
        />
      </div>
      {label ? <p className="mt-1.5 text-xs text-text-tertiary">{label}</p> : null}
    </div>
  );
}
