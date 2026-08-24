import 'server-only';

import { ApiClient } from '@/core/network/api-client';
import { Failure } from '@/core/error/failure';

import type { AdminAccount, AdminCredentials } from '../../domain/entities/admin-account';
import type { AdminAuthDataSource, OtpChallenge } from './admin-auth-data-source';

/// The consultation API as the administrator roster.
///
/// Expects `POST /admin/auth/login` with `{ email, password }`, answering
/// `{ token, admin: { id, email, fullName, role } }`. The API is the authority
/// on who is an administrator — there is no client-side roster and no
/// `isAdmin` flag the browser can influence.
export class ApiAdminAuthDataSource implements AdminAuthDataSource {
  async signIn(email: string, password: string): Promise<AdminCredentials> {
    // No token yet — this is the call that mints one.
    const client = new ApiClient(null);

    const body = await client.post<{
      token?: string;
      admin?: { id?: string; email?: string; fullName?: string; role?: string };
    }>('/admin/auth/login', { email: email.trim().toLowerCase(), password });

    return toCredentials(body, email.trim().toLowerCase());
  }

  /// `POST /admin/auth/otp/request` — asks the API to text a code.
  ///
  /// The number is sent as typed; the API normalises it and is the authority on
  /// what counts as valid, so the console does not keep a second copy of that
  /// rule to fall out of step.
  async requestOtp(phone: string): Promise<OtpChallenge> {
    const client = new ApiClient(null);

    const body = await client.post<{
      verificationId?: string;
      expiresAt?: string;
      resendAfterSeconds?: number;
    }>('/admin/auth/otp/request', { phone });

    if (!body.verificationId) throw Failure.unexpected();

    return {
      verificationId: body.verificationId,
      expiresAt: body.expiresAt ?? new Date(Date.now() + 10 * 60_000).toISOString(),
      resendAfterSeconds: body.resendAfterSeconds ?? 30,
    };
  }

  /// `POST /admin/auth/otp/verify` — answers with the same `{ token, admin }`
  /// the password route does, so a session is written identically either way.
  async verifyOtp(verificationId: string, code: string): Promise<AdminCredentials> {
    const client = new ApiClient(null);

    const body = await client.post<AuthResponse>('/admin/auth/otp/verify', {
      verificationId,
      code,
    });

    return toCredentials(body, '');
  }
}

interface AuthResponse {
  token?: string;
  admin?: { id?: string; email?: string; fullName?: string; role?: string };
}

/// One reader for both routes, so the email and phone paths cannot disagree
/// about what an account is — in particular about the role fallback.
function toCredentials(body: AuthResponse, fallbackEmail: string): AdminCredentials {
  if (!body.token || !body.admin?.id) {
    throw Failure.unexpected();
  }

  const role = body.admin.role;

  const account: AdminAccount = {
    adminId: body.admin.id,
    email: body.admin.email ?? fallbackEmail,
    fullName: body.admin.fullName ?? 'Administrator',
    // Anything unrecognised falls back to the least privileged role rather
    // than to the most: a role the console does not understand must not be
    // read as permission to decide.
    role: role === 'owner' || role === 'reviewer' ? role : 'auditor',
  };

  return { account, apiToken: body.token };
}
