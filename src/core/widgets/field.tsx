'use client';

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

/// Text inputs matching core/widgets/app_text_field.dart: a label above, a
/// filled control, and helper or error text below in the same slot so the
/// layout does not jump when validation fires.
///
/// The control lightens from the muted fill to white on focus and takes a soft
/// ring. Both are transitions rather than jumps, which is what makes tabbing
/// through a form feel like moving along a row rather than like a sequence of
/// unrelated boxes lighting up.
const CONTROL =
  'w-full rounded-[var(--radius-control)] border bg-surface-muted px-3 text-sm text-text-primary ' +
  'placeholder:text-text-tertiary transition-[background-color,border-color,box-shadow] duration-200 ' +
  'hover:border-text-tertiary/60 focus:bg-surface focus:ring-4 focus:ring-primary-soft/15';

export function TextField({
  label,
  error,
  helper,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  readonly label: string;
  readonly error?: string | null;
  readonly helper?: string;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text-label">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint`}
        className={`${CONTROL} h-11 ${
          error ? 'border-danger ring-4 ring-danger/10' : 'border-border'
        }`}
      />
      <Hint id={`${id}-hint`} error={error} helper={helper} />
    </div>
  );
}

export function TextArea({
  label,
  error,
  helper,
  value,
  maxLength = 300,
  minLength,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  readonly label: string;
  readonly error?: string | null;
  readonly helper?: string;
}) {
  const id = useId();
  const length = typeof value === 'string' ? value.trim().length : 0;
  const isShort = !!minLength && length < minLength;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-text-label">
          {label}
        </label>
        {/* The counter counts up to the minimum, not down from the maximum:
            the limit that blocks the reviewer is the floor, not the ceiling.
            It also carries a meter, because "17 more characters" is a number a
            reviewer has to read and a shrinking bar is one they can see. */}
        <span
          className={`tabular text-xs transition-colors duration-200 ${
            isShort ? 'text-warning' : 'text-text-tertiary'
          }`}
        >
          {isShort
            ? `${minLength - length} more character${minLength - length === 1 ? '' : 's'}`
            : `${length}/${maxLength}`}
        </span>
      </div>
      <textarea
        {...rest}
        id={id}
        value={value}
        maxLength={maxLength}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint`}
        className={`${CONTROL} resize-y py-2.5 leading-relaxed ${
          error ? 'border-danger ring-4 ring-danger/10' : 'border-border'
        }`}
      />

      {minLength ? (
        <div
          aria-hidden="true"
          className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-divider-faint"
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out-quint)] ${
              isShort ? 'bg-warning' : 'bg-success-strong'
            }`}
            style={{ width: `${Math.min((length / minLength) * 100, 100)}%` }}
          />
        </div>
      ) : null}

      <Hint id={`${id}-hint`} error={error} helper={helper} />
    </div>
  );
}

/// One slot, always the same height, so a message appearing does not push the
/// rest of the form down the screen. The text fades between states rather than
/// swapping, which keeps a validation message from reading as a flicker.
function Hint({
  id,
  error,
  helper,
}: {
  readonly id: string;
  readonly error?: string | null;
  readonly helper?: string;
}) {
  return (
    <p
      id={id}
      className={`mt-1.5 min-h-[1.125rem] text-[0.8125rem] transition-colors duration-200 ${
        error ? 'animate-rise-sm font-medium text-danger' : 'text-text-secondary'
      }`}
    >
      {error ?? helper ?? ''}
    </p>
  );
}
