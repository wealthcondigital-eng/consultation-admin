/// Backend endpoints and switches.
///
/// Nothing secret is exported through a `NEXT_PUBLIC_` name — anything with
/// that prefix is inlined into the browser bundle and is therefore public, the
/// same rule as `AppConfig` in the Flutter app. The API base URL and the
/// session secret are read server-side only.

/// Which data sources the object graph is built from. Mirrors `AppBackend` in
/// consultation_app/lib/core/di/injector.dart.
export type Backend = 'fake' | 'live';

export const AppConfig = {
  /// `fake` is the default so every screen is walkable with no API running —
  /// the same reason the Flutter widget tests default to fakes.
  backend: (process.env.NEXT_PUBLIC_BACKEND === 'live' ? 'live' : 'fake') as Backend,

  /// The consultation API in `../consultation_api/api`. Server-side only.
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',

  /// How long an admin stays signed in. Short by design: this session can
  /// approve a doctor to practise.
  sessionLifetimeSeconds: 60 * 60 * 8,

  /// How long a document link stays valid. Matches
  /// `SupabaseAdminRemoteDataSource.certificateLinkLifetime` — long enough to
  /// read a document, short enough that a copied URL is not a lasting leak of
  /// someone's registration paperwork.
  documentLinkLifetimeSeconds: 10 * 60,
} as const;

export const isFake = AppConfig.backend === 'fake';
