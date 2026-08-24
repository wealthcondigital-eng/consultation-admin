'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

/// The compact input the sign-in card uses.
///
/// Deliberately **not** `core/widgets/field.tsx`. That one carries a visible
/// label above and a permanently reserved helper line below, which is right for
/// the decision panel — a reviewer filling in a rejection reason needs the
/// counter and the hint pinned in place so the form never shifts under them.
///
/// A sign-in card is the opposite case: two fields whose meaning is obvious
/// from a glyph and a placeholder, on a screen where every reserved empty line
/// is dead space in the middle of a floating card. So the label is `sr-only`
/// (a screen reader still gets it), the icon sits inside the control, and the
/// error line appears only when there is one.
///
/// The layout shift that costs is on the *card*, not on a field: an error
/// pushing the button down by eighteen pixels is fine, because the button is
/// what the reviewer is about to look at anyway.
export function AuthField({
  label,
  icon,
  error,
  trailing,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  readonly label: string;
  readonly icon: ReactNode;
  readonly error?: string | null;
  /// A button inside the control — the show/hide toggle on a password.
  readonly trailing?: ReactNode;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-surface-muted px-3 transition-[border-color,box-shadow,background-color] duration-200 focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary-soft/15 ${
          error
            ? 'border-danger/60 ring-4 ring-danger/10'
            : 'border-border focus-within:border-primary-soft'
        }`}
      >
        <span aria-hidden="true" className="shrink-0 text-text-tertiary">
          {icon}
        </span>

        <input
          {...rest}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />

        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="animate-rise-sm mt-1.5 text-[0.8125rem] font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MailGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m3.5 6.5 5.7 4a1.4 1.4 0 0 0 1.6 0l5.7-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <rect x="4" y="8.5" width="12" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8.5V6.8a3 3 0 1 1 6 0v1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <rect x="5.5" y="2.5" width="9" height="15" rx="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.8 15.2h2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function KeyGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <circle cx="7" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.4 10H17m-2.4 0v2.4m-2-2.4v1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
