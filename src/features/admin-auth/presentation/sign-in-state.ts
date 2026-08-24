/// The sign-in form's state, kept out of `actions.ts` deliberately.
///
/// A `'use server'` module may only export async functions — everything else it
/// exports would have to be callable across the network boundary. Constants and
/// types for an action therefore live beside it rather than in it.
export interface SignInState {
  readonly error: string | null;
  readonly fieldErrors: { email?: string; password?: string };
}

export const emptySignInState: SignInState = { error: null, fieldErrors: {} };

/// The phone form's state.
///
/// One state object covers both steps, because they are one flow and the form
/// has to remember the challenge across them. `challenge` being non-null is
/// what moves the screen from "enter your number" to "enter the code" — there
/// is no separate step flag to fall out of step with it.
export interface PhoneSignInState {
  readonly error: string | null;
  readonly fieldErrors: { phone?: string; code?: string };
  readonly challenge: {
    readonly verificationId: string;
    readonly phone: string;
    readonly expiresAt: string;
    readonly resendAfterSeconds: number;
    /// Bumped on every resend. The countdown timer watches it, so asking for a
    /// second code restarts the clock even though every other field is
    /// unchanged.
    readonly issuedAt: number;
  } | null;
}

export const emptyPhoneSignInState: PhoneSignInState = {
  error: null,
  fieldErrors: {},
  challenge: null,
};

/// Trims a typed number to its ten national digits, or null.
///
/// The API is the authority on what it will accept — this only catches the
/// obvious before spending a round trip, and gives the field something to
/// display while the reviewer is still typing.
export function nationalDigits(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const national =
    digits.length === 10
      ? digits
      : digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : null;

  return national && /^[6-9]\d{9}$/.test(national) ? national : null;
}
