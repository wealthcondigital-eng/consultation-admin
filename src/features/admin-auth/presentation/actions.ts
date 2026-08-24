'use server';

import { redirect } from 'next/navigation';

import { authDataSource } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { clearSession, writeSession } from '@/core/session/admin-session';

import { emailError, passwordError } from '../domain/entities/admin-account';
import {
  nationalDigits,
  type PhoneSignInState,
  type SignInState,
} from './sign-in-state';

/// Signs an administrator in and starts their session.
///
/// A server action rather than a route handler, so the password is submitted
/// with the form and never touches client-side JavaScript state. The session
/// cookie is set here; the token inside it never reaches the browser.
export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const fieldErrors = {
    ...(emailError(email) ? { email: emailError(email)! } : {}),
    ...(passwordError(password) ? { password: passwordError(password)! } : {}),
  };

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  try {
    const { account, apiToken } = await authDataSource().signIn(email, password);

    await writeSession({
      adminId: account.adminId,
      email: account.email,
      fullName: account.fullName,
      apiToken,
    });
  } catch (error) {
    return { error: messageFor(error), fieldErrors: {} };
  }

  // Outside the try: `redirect` works by throwing, so catching around it would
  // swallow the navigation and report it as a sign-in failure.
  redirect('/overview');
}

/// The phone form's single entry point.
///
/// Both steps go through one action, and therefore share one `useActionState`.
/// Two actions would mean two states, and the challenge minted by the first
/// would not be in the `previous` the second receives — the verification id
/// would have to be carried in a hidden input, where the browser could edit it.
/// This way it never leaves the server's copy of the state.
export async function phoneSignInAction(
  previous: PhoneSignInState,
  formData: FormData,
): Promise<PhoneSignInState> {
  return String(formData.get('intent') ?? '') === 'verify'
    ? verifyOtpAction(previous, formData)
    : requestOtpAction(previous, formData);
}

/// Step one of the phone sign-in: ask the API to text a code.
///
/// Returns a challenge whether or not the number belongs to an administrator —
/// the API answers identically either way, and this must not add a distinction
/// the API was careful not to make. The only refusals surfaced here are a
/// malformed number and a rate limit, neither of which says anything about the
/// roster.
///
/// Handles the resend too. A resend is the same call with the same number, so a
/// second action would be the same code with a different name; `intent=resend`
/// only changes the message shown afterwards.
export async function requestOtpAction(
  previous: PhoneSignInState,
  formData: FormData,
): Promise<PhoneSignInState> {
  const typed = String(formData.get('phone') ?? '');
  const phone = nationalDigits(typed);

  if (!phone) {
    return {
      error: null,
      fieldErrors: { phone: 'Enter a 10-digit Indian mobile number.' },
      // Keep any challenge already in flight: a stray malformed resend must not
      // throw away the code the reviewer is in the middle of typing.
      challenge: previous.challenge,
    };
  }

  try {
    const challenge = await authDataSource().requestOtp(phone);

    return {
      error: null,
      fieldErrors: {},
      challenge: { ...challenge, phone, issuedAt: Date.now() },
    };
  } catch (error) {
    return {
      error: messageFor(error),
      fieldErrors: {},
      challenge: previous.challenge,
    };
  }
}

/// Step two: exchange the code for a session.
export async function verifyOtpAction(
  previous: PhoneSignInState,
  formData: FormData,
): Promise<PhoneSignInState> {
  const challenge = previous.challenge;
  const code = String(formData.get('code') ?? '').trim();

  // The challenge lives in the action's state rather than in a hidden input, so
  // a verification id cannot be swapped by editing the form.
  if (!challenge) {
    return {
      error: 'That code has expired. Request a new one.',
      fieldErrors: {},
      challenge: null,
    };
  }

  if (!/^\d{4,8}$/.test(code)) {
    return {
      error: null,
      fieldErrors: { code: 'Enter the code from the message.' },
      challenge,
    };
  }

  try {
    const { account, apiToken } = await authDataSource().verifyOtp(
      challenge.verificationId,
      code,
    );

    await writeSession({
      adminId: account.adminId,
      email: account.email,
      fullName: account.fullName,
      apiToken,
    });
  } catch (error) {
    return { error: messageFor(error), fieldErrors: {}, challenge };
  }

  // Outside the try, for the same reason as `signInAction`: `redirect` throws.
  redirect('/overview');
}

export async function signOutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}
