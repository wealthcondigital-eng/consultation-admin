import 'server-only';

import type { ApiClient } from '@/core/network/api-client';

import type {
  ApplicationStatus,
  DoctorReview,
} from '../../domain/entities/doctor-review';
import type { VerificationEvent } from '../../domain/entities/verification-event';
import type { QueueSummary } from '../../domain/repositories/review-repository';
import type { ReviewDataSource } from './review-data-source';

/// The consultation API as the review queue.
///
/// This is the contract the NestJS side has to satisfy. It is written down here,
/// as one file, so the API can be built against something concrete instead of
/// against a guess — every path and payload the console uses is below and
/// nowhere else.
///
/// | Method | Path                                                    |
/// | ------ | ------------------------------------------------------- |
/// | GET    | /admin/doctors?status=under_review                       |
/// | GET    | /admin/doctors/summary                                   |
/// | GET    | /admin/doctors/:doctorId                                 |
/// | POST   | /admin/doctors/:doctorId/documents/:documentId/decision  |
/// | POST   | /admin/doctors/:doctorId/approve                         |
/// | POST   | /admin/doctors/:doctorId/reject                          |
/// | POST   | /admin/doctors/:doctorId/request-changes                 |
/// | GET    | /admin/doctors/:doctorId/documents/:documentId/url       |
/// | GET    | /admin/events?doctorId=                                  |
///
/// Every route sits behind the admin guard on the API. The console being the
/// only caller is not a security property — the bearer token is.
export class ApiReviewDataSource implements ReviewDataSource {
  constructor(private readonly client: ApiClient) {}

  async fetchQueue(status?: ApplicationStatus): Promise<DoctorReview[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const body = await this.client.get<{ doctors: DoctorReview[] }>(
      `/admin/doctors${query}`,
    );
    return body.doctors ?? [];
  }

  fetchSummary(): Promise<QueueSummary> {
    return this.client.get<QueueSummary>('/admin/doctors/summary');
  }

  async fetchApplication(doctorId: string): Promise<DoctorReview | null> {
    const body = await this.client.get<{ doctor: DoctorReview | null }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}`,
    );
    return body.doctor ?? null;
  }

  async decideDocument({
    doctorId,
    documentId,
    decision,
    note,
  }: {
    doctorId: string;
    documentId: string;
    decision: 'accepted' | 'rejected';
    note?: string;
  }): Promise<DoctorReview> {
    const body = await this.client.post<{ doctor: DoctorReview }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}/documents/${encodeURIComponent(
        documentId,
      )}/decision`,
      { decision, note },
    );
    return body.doctor;
  }

  async approve(doctorId: string): Promise<DoctorReview> {
    const body = await this.client.post<{ doctor: DoctorReview }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}/approve`,
    );
    return body.doctor;
  }

  async reject(doctorId: string, reason: string): Promise<DoctorReview> {
    const body = await this.client.post<{ doctor: DoctorReview }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}/reject`,
      { reason },
    );
    return body.doctor;
  }

  async requestChanges(doctorId: string, reason: string): Promise<DoctorReview> {
    const body = await this.client.post<{ doctor: DoctorReview }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}/request-changes`,
      { reason },
    );
    return body.doctor;
  }

  /// A presigned S3 link, minted by the API and valid for minutes.
  ///
  /// The bucket is private, so this is the only way to see a document. The link
  /// is deliberately not stored anywhere: it expires, and a copied URL should
  /// not outlive the review.
  async documentUrl(doctorId: string, documentId: string): Promise<string> {
    const body = await this.client.get<{ url: string }>(
      `/admin/doctors/${encodeURIComponent(doctorId)}/documents/${encodeURIComponent(
        documentId,
      )}/url`,
    );
    return body.url;
  }

  async fetchEvents(doctorId?: string): Promise<VerificationEvent[]> {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
    const body = await this.client.get<{ events: VerificationEvent[] }>(
      `/admin/events${query}`,
    );
    return body.events ?? [];
  }
}
