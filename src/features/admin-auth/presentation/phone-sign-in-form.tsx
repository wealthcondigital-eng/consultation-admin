'use client';

import { useActionState, useEffect, useState } from 'react';

import { AppButton } from '@/core/widgets/button';

import { AuthError } from './auth-error';
import { AuthField, KeyGlyph, PhoneGlyph } from './auth-field';
import { phoneSignInAction } from './actions';
import { emptyPhoneSignInState } from './sign-in-state';

/// Sign in with a mobile number and a one-time code.
///
/// Two steps in one form and one action state. The challenge — the id the code
/// is checked against — lives in the action's state on the server and is never
/// rendered into the markup, so there is no verification id for a browser to
/// edit and no hidden input to tamper with.
///
/// The number stays in the form after the code is sent, which is what makes
/// **resend** a re-submission of the same field rather than a second code path
/// with its own copy of the number.
export function PhoneSignInForm() {
  const [state, action, isPending] = useActionState(
    phoneSignInAction,
    emptyPhoneSignInState,
  );

  const challenge = state.challenge;
  const [phone, setPhone] = useState('');

  return (
    <form action={action} className="space-y-3">
      <AuthField
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        required
        readOnly={!!challenge}
        value={phone}
        onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
        placeholder="Mobile number"
        error={state.fieldErrors.phone}
        // The country code is shown rather than typed. Every administrator is
        // on an Indian number, and a field that accepts `+91`, `0091` and
        // nothing at all is a field that produces three spellings of one number.
        //
        // It takes the icon slot rather than sitting after the input: a country
        // code goes to the *left* of the digits it prefixes, and a `+91` on the
        // right reads as a unit of measure rather than as part of the number.
        icon={
          <span className="flex items-center gap-2 text-text-tertiary">
            <PhoneGlyph />
            <span className="text-sm font-semibold text-text-secondary select-none">+91</span>
            <span aria-hidden="true" className="h-5 w-px bg-border" />
          </span>
        }
      />

      <AuthError message={state.error} />

      {challenge ? (
        // Keyed on the issue time, so a resend **remounts** this block and the
        // code box comes back empty. Clearing it from an effect instead would
        // be a second render triggered by the first, which is both slower and
        // the thing `react-hooks/set-state-in-effect` exists to catch.
        <CodeStep
          key={challenge.issuedAt}
          issuedAt={challenge.issuedAt}
          cooldownSeconds={challenge.resendAfterSeconds}
          codeError={state.fieldErrors.code}
          isPending={isPending}
        />
      ) : (
        <div className="pt-1">
          <AppButton
            label="Send me a code"
            name="intent"
            value="request"
            type="submit"
            variant="dark"
            isLoading={isPending}
            fullWidth
            disabled={phone.length !== 10}
          />
        </div>
      )}
    </form>
  );
}

/// The second step: the code, the verify button, and the way back.
///
/// Its own component purely so that remounting it resets the digits.
function CodeStep({
  issuedAt,
  cooldownSeconds,
  codeError,
  isPending,
}: {
  readonly issuedAt: number;
  readonly cooldownSeconds: number;
  readonly codeError?: string;
  readonly isPending: boolean;
}) {
  const [code, setCode] = useState('');

  return (
    <div className="animate-rise-sm space-y-3">
      <AuthField
        label="One-time code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={8}
        autoFocus
        required
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        placeholder="One-time code"
        icon={<KeyGlyph />}
        error={codeError}
      />

      {/* Says "if", and says what to do when nothing turns up.
          The request endpoint answers identically whether or not the number is
          on the roster — that is deliberate, and it is what stops this form
          being used to discover which numbers belong to administrators. The
          cost is that an unregistered number lands here and waits for a message
          that is never coming.
          This copy pays that cost back. It is shown to everyone in both cases,
          so it reveals nothing about any particular number, and it replaces a
          silent dead end with an explanation. */}
      <p className="px-1 text-[0.8125rem] leading-relaxed text-text-secondary">
        If this number is registered to an administrator, a code is on its way.
        It expires in 10 minutes. Nothing arriving? The number may not be on the
        roster — sign in with your work email instead.
      </p>

      <div className="pt-1">
        <AppButton
          label="Verify and sign in"
          name="intent"
          value="verify"
          type="submit"
          variant="dark"
          isLoading={isPending}
          fullWidth
          disabled={code.length < 4}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <ResendButton
          issuedAt={issuedAt}
          cooldownSeconds={cooldownSeconds}
          isPending={isPending}
        />

        {/* Reloads the form rather than clearing state by hand: the challenge
            lives on the server, and the honest way to abandon it is to start
            again. */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="cursor-pointer rounded-md px-1.5 py-1 text-[0.8125rem] font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-muted hover:text-text-label"
        >
          Change number
        </button>
      </div>
    </div>
  );
}

/// Resend, with the wait shown rather than hidden behind a refusal.
///
/// The API enforces the cooldown regardless — this is not the control, it is
/// the courtesy. A button that looks live and then answers "please wait 24s" is
/// a button that teaches people to hammer it.
function ResendButton({
  issuedAt,
  cooldownSeconds,
  isPending,
}: {
  readonly issuedAt: number;
  readonly cooldownSeconds: number;
  readonly isPending: boolean;
}) {
  // Seeded from the clock at first render rather than from `cooldownSeconds`,
  // so the very first paint already shows the true remaining time.
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil(cooldownSeconds - (Date.now() - issuedAt) / 1000)),
  );

  // Subscribing to the clock — an external system — which is exactly what an
  // effect is for.
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(
        Math.max(0, Math.ceil(cooldownSeconds - (Date.now() - issuedAt) / 1000)),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [issuedAt, cooldownSeconds]);

  const waiting = remaining > 0;

  return (
    <button
      type="submit"
      name="intent"
      value="request"
      disabled={waiting || isPending}
      className={`rounded-md px-1.5 py-1 text-[0.8125rem] font-semibold transition-colors duration-200 ${
        waiting
          ? 'cursor-not-allowed text-text-tertiary'
          : 'cursor-pointer text-primary-vivid hover:bg-primary-surface'
      }`}
    >
      {waiting ? (
        <>
          Resend in <span className="tabular">{remaining}s</span>
        </>
      ) : (
        'Resend code'
      )}
    </button>
  );
}
