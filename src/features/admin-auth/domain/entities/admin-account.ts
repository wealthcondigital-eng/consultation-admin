/// An administrator who may review registrations.
///
/// A separate identity from the app's `users` collection on purpose. The
/// patient and doctor apps sign in with a phone OTP; a console that can approve
/// someone to practise medicine signs in with an email, a password and — in
/// production — a second factor. Hanging an `isAdmin` flag off the phone-OTP
/// user would mean anyone who can receive an SMS is one credential away from
/// the approval queue.
export interface AdminAccount {
  readonly adminId: string;
  readonly email: string;
  readonly fullName: string;

  /// What this administrator is allowed to do. Reviewers decide applications;
  /// auditors can read the trail but not change anything.
  readonly role: AdminRole;
}

export type AdminRole = 'reviewer' | 'auditor' | 'owner';

/// The result of a successful sign-in: who they are, plus the API token the
/// console will forward on their behalf.
export interface AdminCredentials {
  readonly account: AdminAccount;
  readonly apiToken: string;
}

/// Whether this role may record a decision. An auditor sees the same screens
/// with the actions withheld.
export function canDecide(role: AdminRole): boolean {
  return role === 'reviewer' || role === 'owner';
}

/// The shortest password the console will accept at sign-in. Deliberately a
/// floor and not a policy — the API owns the real rules, this only avoids a
/// pointless round trip on an obviously empty field.
export const MIN_PASSWORD_LENGTH = 8;

export function emailError(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return 'Enter your work email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'That does not look like an email address.';
  return null;
}

export function passwordError(password: string): string | null {
  if (password.length === 0) return 'Enter your password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwords are at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
