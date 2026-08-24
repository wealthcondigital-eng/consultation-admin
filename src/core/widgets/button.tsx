'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/// The three button roles from core/widgets/app_button.dart — primary, outline
/// and a destructive variant the phone app did not need — plus the loading
/// state, which matters more here: a decision that looks like it did not
/// register gets clicked twice.
export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'success'
  | 'dark';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly isLoading?: boolean;
  readonly icon?: ReactNode;
  readonly size?: 'md' | 'sm';
  readonly fullWidth?: boolean;
}

/// Two things happen on hover beyond the colour change: the surface darkens and
/// the button lifts a hair on its shadow. The lift is only on the filled
/// variants — an outline button has no shadow to lift off, and giving it one
/// would make a secondary action look like a primary one.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white border border-transparent shadow-[0_1px_2px_rgb(30_64_175/0.20)] ' +
    'hover:bg-primary-deep hover:shadow-[0_4px_14px_rgb(30_64_175/0.30)] active:bg-primary-deep',
  success:
    'bg-success-strong text-white border border-transparent shadow-[0_1px_2px_rgb(5_150_105/0.20)] ' +
    'hover:brightness-95 hover:shadow-[0_4px_14px_rgb(5_150_105/0.28)] active:brightness-90',
  danger:
    'bg-white text-danger border border-danger/40 hover:bg-danger-surface hover:border-danger/70 active:bg-danger-surface',
  outline:
    'bg-white text-text-label border border-border hover:bg-surface-muted hover:border-text-tertiary active:bg-divider-faint',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-surface-muted hover:text-text-label',
  // The sign-in card only. `textPrimary` — the palette's near-black — rather
  // than `primary`: the card already carries a blue mark and a blue-tinted
  // switch, and a third blue would leave nothing on the screen dominant. This
  // is the one element to press, so it is the one element that is not blue.
  dark:
    'bg-text-primary text-white border border-transparent shadow-[0_1px_2px_rgb(16_24_40/0.24)] ' +
    'hover:brightness-125 hover:shadow-[0_6px_18px_rgb(16_24_40/0.24)] active:brightness-100',
};

export function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  icon,
  size = 'md',
  fullWidth = false,
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        'press group relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'rounded-[var(--radius-control)] font-semibold select-none',
        size === 'md' ? 'h-11 px-4 text-sm' : 'h-9 px-3 text-[0.8125rem]',
        fullWidth ? 'w-full' : '',
        VARIANTS[variant],
        // Disabled is styled rather than merely unclickable: a button that
        // looks live but does nothing reads as a broken screen.
        isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      {/* The icon slot keeps its width whether it holds an icon, a spinner or
          nothing, so a button does not resize the instant it is pressed and
          shove the button beside it sideways. */}
      {isLoading || icon ? (
        <span className="grid size-4 shrink-0 place-items-center">
          {isLoading ? <Spinner /> : icon}
        </span>
      ) : null}
      <span>{label}</span>

      {/* A band of light that crosses the button while the action is in
          flight. On the filled variants this is the clearest possible "still
          working" without a layout change: nothing moves, nothing resizes. */}
      {isLoading ? (
        <span
          aria-hidden="true"
          className="sheen pointer-events-none absolute inset-0 opacity-40"
        />
      ) : null}
    </button>
  );
}

export function Spinner({ className = '' }: { readonly className?: string }) {
  return (
    <span
      role="status"
      aria-label="Working"
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
