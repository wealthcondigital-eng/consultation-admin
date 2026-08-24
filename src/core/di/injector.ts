import 'server-only';

import { AppConfig } from '@/core/config/app-config';
import { ApiClient } from '@/core/network/api-client';
import { readSession, type AdminSession } from '@/core/session/admin-session';
import { Failure } from '@/core/error/failure';

import { FakeAdminAuthDataSource } from '@/features/admin-auth/data/datasources/admin-auth-data-source';
import type { AdminAuthDataSource } from '@/features/admin-auth/data/datasources/admin-auth-data-source';
import { ApiAdminAuthDataSource } from '@/features/admin-auth/data/datasources/api-admin-auth-data-source';

import { ApiReviewDataSource } from '@/features/doctor-review/data/datasources/api-review-data-source';
import { FakeReviewDataSource } from '@/features/doctor-review/data/datasources/fake-review-data-source';
import { ReviewRepositoryImpl } from '@/features/doctor-review/data/repositories/review-repository-impl';
import type { ReviewRepository } from '@/features/doctor-review/domain/repositories/review-repository';
import { DecideApplication } from '@/features/doctor-review/domain/usecases/decide-application';

/// Wires the object graph, per request.
///
/// The analogue of `configureDependencies` in consultation_app/lib/core/di/injector.dart, with
/// one structural difference: there is no long-lived container. A server request
/// builds what it needs and throws it away, because the graph depends on *who
/// is asking* — the review repository is constructed around the caller's own
/// API token, so one request can never be served with another admin's
/// authority.
///
/// Registration order follows the dependency direction: data sources, then
/// repositories, then use cases.

export function authDataSource(): AdminAuthDataSource {
  return AppConfig.backend === 'live'
    ? new ApiAdminAuthDataSource()
    : new FakeAdminAuthDataSource();
}

export interface ReviewGraph {
  readonly repository: ReviewRepository;
  readonly decide: DecideApplication;
  readonly session: AdminSession;
}

/// Builds the review graph for the signed-in administrator, or throws if there
/// is not one. Every server action and route handler starts here, which is what
/// makes "is this caller allowed in" a single decision rather than a habit.
export async function reviewGraph(): Promise<ReviewGraph> {
  const session = await readSession();
  if (!session) throw Failure.unauthorised();

  const source =
    AppConfig.backend === 'live'
      ? new ApiReviewDataSource(new ApiClient(session.apiToken))
      : new FakeReviewDataSource(session.fullName);

  const repository = new ReviewRepositoryImpl(source);

  return {
    repository,
    decide: new DecideApplication(repository),
    session,
  };
}
