import type { ReactNode } from 'react';

/// A white card on the canvas — the layout primitive the whole console is built
/// from, matching the `AppShadows.card` treatment in the Flutter design.
export function Card({
  children,
  padded = true,
  hoverable = false,
  className = '',
}: {
  readonly children: ReactNode;
  readonly padded?: boolean;
  /// Only for a card that is itself a link or a button. A card that lifts under
  /// the pointer and then does nothing when clicked is a worse lie than a card
  /// that never moved.
  readonly hoverable?: boolean;
  readonly className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)] ${
        padded ? 'p-5' : ''
      } ${hoverable ? 'lift hover:border-primary-soft/60' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
  /// A tinted glyph to the left of the title. Worth it on a screen carrying
  /// four or five cards, where the icons become the thing the eye jumps
  /// between rather than the headings.
  readonly icon?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-primary-surface text-primary-vivid">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-card-title text-text-primary">{title}</h2>
          {subtitle ? <p className="text-helper mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

/// A label/value pair. The console shows a lot of these, and they all have to
/// line up — mirrors the `_Detail` row in admin_queue_screen.dart.
///
/// The row tints faintly under the pointer. On a block of eight rows that is
/// what keeps the eye on one line while it travels from the label on the left
/// to the value on the right.
export function DetailRow({
  label,
  value,
  verified = false,
}: {
  readonly label: string;
  readonly value?: string | number | null;
  readonly verified?: boolean;
}) {
  const text = value === null || value === undefined || value === '' ? null : String(value);

  return (
    <div className="group -mx-2 flex items-start gap-3 rounded-[var(--radius-chip)] border-b border-divider-faint px-2 py-2.5 transition-colors duration-200 last:border-b-0 hover:bg-surface-muted">
      <dt className="text-meta-label w-40 shrink-0 pt-0.5 transition-colors duration-200 group-hover:text-text-secondary">
        {label}
      </dt>
      <dd className="text-card-body min-w-0 flex-1 break-words">
        {text ?? <span className="text-text-tertiary italic">Not given</span>}
        {verified && text ? (
          <span
            title="Read off the uploaded certificate rather than typed by hand"
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-success-surface px-1.5 py-0.5 align-middle text-[0.6875rem] font-semibold text-success ring-1 ring-success/15 ring-inset"
          >
            <CheckIcon />
            from certificate
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
      <path
        d="M13 4.5 6.5 11 3 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
