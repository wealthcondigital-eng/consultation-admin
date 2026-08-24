'use client';

import { useActionState, useState } from 'react';

import { AppButton } from '@/core/widgets/button';

import { AuthField, LockGlyph, MailGlyph } from './auth-field';
import { AuthError } from './auth-error';
import { signInAction } from './actions';
import { emptySignInState } from './sign-in-state';

export function SignInForm() {
  const [state, action, isPending] = useActionState(signInAction, emptySignInState);
  const [revealed, setRevealed] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <AuthField
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        autoFocus
        required
        placeholder="Work email"
        icon={<MailGlyph />}
        error={state.fieldErrors.email}
      />

      <AuthField
        label="Password"
        name="password"
        type={revealed ? 'text' : 'password'}
        autoComplete="current-password"
        required
        placeholder="Password"
        icon={<LockGlyph />}
        error={state.fieldErrors.password}
        trailing={
          // Worth having on a console: these passwords are long, typed on a
          // shared desk, and a refused sign-in that was really a typo costs a
          // reviewer more than the glance costs in privacy.
          <button
            type="button"
            onClick={() => setRevealed((was) => !was)}
            aria-pressed={revealed}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="cursor-pointer rounded-md p-1 text-text-tertiary transition-colors duration-200 hover:text-text-label"
          >
            {revealed ? <EyeOffGlyph /> : <EyeGlyph />}
          </button>
        }
      />

      {/* The form-level error, kept separate from the field errors: a refused
          sign-in is not a fault with either field in particular, and saying
          which one was wrong would turn this into a way to test which
          addresses have accounts. */}
      <AuthError message={state.error} />

      <div className="pt-1">
        <AppButton
          label="Sign in"
          type="submit"
          variant="dark"
          isLoading={isPending}
          fullWidth
        />
      </div>
    </form>
  );
}

function EyeGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M4 4.4 16 15.6M7.6 5.6A7.7 7.7 0 0 1 10 5.2c5.1 0 8.2 4.8 8.2 4.8a13 13 0 0 1-2.9 3.2M5.3 7A13 13 0 0 0 1.8 10S4.9 14.8 10 14.8c.8 0 1.5-.1 2.2-.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
