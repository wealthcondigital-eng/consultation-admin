import { Failure } from '@/core/error/failure';

import type { AdminCredentials } from '../../domain/entities/admin-account';

/// What the console gets back after asking for a code.
///
/// Deliberately says nothing about whether the number belongs to an
/// administrator. The API answers identically either way — see
/// `AdminOtpService` — and a shape with a `found` flag in it would undo that
/// the moment somebody rendered it.
export interface OtpChallenge {
  readonly verificationId: string;
  readonly expiresAt: string;
  readonly resendAfterSeconds: number;
}

/// Talks to whatever holds the administrator roster.
export interface AdminAuthDataSource {
  signIn(email: string, password: string): Promise<AdminCredentials>;

  /// Asks for a one-time code to be texted to `phone`.
  requestOtp(phone: string): Promise<OtpChallenge>;

  /// Exchanges a code for a session. `verificationId` comes from `requestOtp`.
  verifyOtp(verificationId: string, code: string): Promise<AdminCredentials>;
}

/// Stand-in roster, so the console is walkable with no API running.
///
/// The credentials are printed on the sign-in screen when the backend is
/// `fake`, because a demo login nobody can guess is not a demo. This class is
/// unreachable when `NEXT_PUBLIC_BACKEND=live`, and the check in
/// `core/di/injector.ts` is what guarantees that.
export class FakeAdminAuthDataSource implements AdminAuthDataSource {
  static readonly demoEmail = 'admin@teleconsult.local';
  static readonly demoPassword = 'review-me-1234';
  static readonly demoPhone = '9109992291';
  /// Fixed, and shown on the screen. A random code with no handset to receive
  /// it would make the phone tab impossible to demonstrate.
  static readonly demoCode = '1234';

  async signIn(email: string, password: string): Promise<AdminCredentials> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const matches =
      email.trim().toLowerCase() === FakeAdminAuthDataSource.demoEmail &&
      password === FakeAdminAuthDataSource.demoPassword;

    // One message for both a wrong email and a wrong password. Saying which was
    // wrong turns the form into a way to test which addresses have accounts.
    if (!matches) {
      throw new Failure('That email and password do not match an administrator.');
    }

    return this.session();
  }

  /// Succeeds for any well-formed number, exactly as the real one does — the
  /// answer must not reveal whether a number is on the roster, and a fake that
  /// leaked what the real one hides would be a fake worth distrusting.
  async requestOtp(phone: string): Promise<OtpChallenge> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      throw new Failure('Enter a 10-digit Indian mobile number.');
    }

    return {
      // Carries the number so `verifyOtp` can check it without a store.
      verificationId: `fake:${phone.replace(/\D/g, '').slice(-10)}`,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      resendAfterSeconds: 30,
    };
  }

  async verifyOtp(verificationId: string, code: string): Promise<AdminCredentials> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const phone = verificationId.startsWith('fake:') ? verificationId.slice(5) : '';

    // Wrong code and wrong number give the same refusal, for the same reason
    // the email path gives one message for two failures.
    if (
      code !== FakeAdminAuthDataSource.demoCode ||
      phone !== FakeAdminAuthDataSource.demoPhone
    ) {
      throw new Failure('That code is incorrect. Please try again.');
    }

    return this.session();
  }

  private session(): AdminCredentials {
    return {
      account: {
        adminId: 'admin-1',
        email: FakeAdminAuthDataSource.demoEmail,
        fullName: 'Priya Menon',
        role: 'reviewer',
      },
      apiToken: 'fake-admin-token',
    };
  }
}
