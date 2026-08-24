import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

import { AppConfig } from '@/core/config/app-config';

/// The signed-in administrator, as the console knows them between requests.
///
/// The analogue of `AuthSession` in the Flutter app, with one deliberate
/// difference: the app's session is phone-OTP and lives in `SharedPreferences`,
/// while this one is email + password and lives in an `httpOnly` cookie the
/// browser cannot read. A console that can approve a doctor to practise should
/// not keep its token anywhere a script on the page can reach.
export interface AdminSession {
  readonly adminId: string;
  readonly email: string;
  readonly fullName: string;
  /// The API bearer token, forwarded by the /api routes. Never sent to the
  /// browser — it lives inside the httpOnly cookie only.
  readonly apiToken: string;
  readonly expiresAt: number;
}

/// What a screen is allowed to know about the signed-in admin. Deliberately
/// excludes `apiToken`: a component that could read the token could leak it
/// into markup.
export type AdminIdentity = Omit<AdminSession, 'apiToken' | 'expiresAt'>;

const COOKIE = 'admin_session';

function secret(): Buffer {
  const value = process.env.ADMIN_SESSION_SECRET;

  if (!value || value === 'replace-me-with-32-random-bytes') {
    // Refuses rather than falling back to a constant. A predictable signing key
    // means anyone can mint a session that approves doctors.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ADMIN_SESSION_SECRET is not set. Generate one with: ' +
          'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    // Development only, and regenerated per process — restarting the dev server
    // signs everyone out, which is the correct trade for never shipping a
    // hard-coded key.
    devSecret ??= randomBytes(32);
    return devSecret;
  }

  return Buffer.from(value, 'utf8');
}

let devSecret: Buffer | null = null;

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/// Encodes and signs. The signature covers the whole payload, so neither the
/// expiry nor the admin id can be edited in the browser.
export function encodeSession(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(cookie: string | undefined): AdminSession | null {
  if (!cookie) return null;

  const dot = cookie.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = cookie.slice(0, dot);
  const provided = cookie.slice(dot + 1);
  const expected = sign(payload);

  // Constant-time: a fast-fail comparison leaks how much of a forged signature
  // was right, one byte at a time.
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;

  let session: AdminSession;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
  } catch {
    // A format change between deploys looks exactly like this.
    return null;
  }

  if (typeof session.adminId !== 'string' || typeof session.expiresAt !== 'number') {
    return null;
  }

  // Expired an minute early, so a request is never sent with a token that dies
  // in flight — the same guard as `_Session.hasExpired` in the Flutter app.
  if (Date.now() > session.expiresAt - 60_000) return null;

  return session;
}

export async function readSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

/// The identity, with the API token stripped, for passing into components.
export async function readIdentity(): Promise<AdminIdentity | null> {
  const session = await readSession();
  if (!session) return null;

  const { adminId, email, fullName } = session;
  return { adminId, email, fullName };
}

export async function writeSession(
  session: Omit<AdminSession, 'expiresAt'>,
): Promise<void> {
  const store = await cookies();

  store.set(COOKIE, encodeSession({
    ...session,
    expiresAt: Date.now() + AppConfig.sessionLifetimeSeconds * 1000,
  }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AppConfig.sessionLifetimeSeconds,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
