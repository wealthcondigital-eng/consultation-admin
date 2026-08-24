'use client';

import { useState } from 'react';

import { PhoneSignInForm } from './phone-sign-in-form';
import { SignInForm } from './sign-in-form';

type Mode = 'email' | 'phone';

const COPY: Record<Mode, { title: string; blurb: string }> = {
  email: {
    title: 'Sign in with email',
    blurb:
      'Review doctor registrations, one document at a time. Every decision is recorded against your name.',
  },
  phone: {
    title: 'Sign in with your mobile',
    blurb:
      'We text a one-time code to the number registered against your administrator account.',
  },
};

/// The sign-in card: two ways in, one switch between them.
///
/// The switch is a **segmented control, not a pair of tabs**. Tabs imply
/// sibling content in one document; this is one decision with two settings, and
/// the sliding thumb says so — the highlight travels between the options
/// instead of blinking from one to the other, which is what makes a toggle read
/// as a physical switch.
///
/// The heading changes with it, and that is why the switch sits *above* the
/// title rather than under the fields. "Sign in with email" naming the method
/// is what makes the card legible at a glance; a fixed title over changing
/// fields would leave the reviewer to work out which mode they are in from the
/// shape of the inputs.
///
/// The two forms are deliberately **not** mounted at once. A password input
/// sitting hidden behind the phone tab is still a password input in the DOM for
/// a password manager to fill and for a script to read, and the whole reason
/// this console keeps credentials in server actions is to avoid exactly that.
export function SignInPanel() {
  const [mode, setMode] = useState<Mode>('email');

  const OPTIONS = [
    { value: 'email' as const, label: 'Work email', icon: <MailIcon /> },
    { value: 'phone' as const, label: 'Mobile OTP', icon: <PhoneIcon /> },
  ];

  return (
    <div>
      <div
        role="group"
        aria-label="How to sign in"
        className="relative mx-auto mb-6 flex h-10 max-w-[17rem] items-stretch rounded-full border border-border bg-surface-muted p-1"
      >
        {/* Inset by the same 0.25rem on every side, so translating it by its
            own width lands it exactly on the second segment. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-[0_1px_3px_rgb(16_24_40/0.12)] transition-transform duration-300 ease-[var(--ease-out-quint)]"
          style={{ transform: mode === 'phone' ? 'translateX(100%)' : 'translateX(0)' }}
        />

        {OPTIONS.map((option) => {
          const active = mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(option.value)}
              className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                active ? 'text-text-primary' : 'text-text-secondary hover:text-text-label'
              }`}
            >
              <span
                className={`transition-transform duration-300 ease-[var(--ease-spring)] ${
                  active ? 'scale-110 text-primary-vivid' : 'text-text-tertiary'
                }`}
              >
                {option.icon}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Keyed on the mode, so the heading and the fields change together and
          replay their entrance. Without the key React reconciles the two forms
          into one element and the change is an instant, unexplained swap. */}
      <div key={mode} className="animate-rise-sm">
        <h1 className="text-center text-[1.375rem] font-extrabold tracking-tight text-text-primary">
          {COPY[mode].title}
        </h1>
        <p className="mx-auto mt-1.5 mb-6 max-w-[19rem] text-center text-[0.8125rem] leading-relaxed text-text-secondary">
          {COPY[mode].blurb}
        </p>

        {mode === 'email' ? <SignInForm /> : <PhoneSignInForm />}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m3 6 6.2 4.4a1.4 1.4 0 0 0 1.6 0L17 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
      <rect x="5.5" y="2.5" width="9" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 15.2h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
