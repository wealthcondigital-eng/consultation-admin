import type { ApplicationStatus, DoctorReview } from '../../domain/entities/doctor-review';
import type { VerificationEvent } from '../../domain/entities/verification-event';
import type {
  QueueSummary,
  ReviewRepository,
} from '../../domain/repositories/review-repository';
import type { ReviewDataSource } from '../datasources/review-data-source';

/// Passes through to the data source.
///
/// Thin on purpose, and the same shape as `AdminRepositoryImpl` in the Flutter
/// app: the layer exists so the domain depends on an interface it owns rather
/// than on whichever backend happens to be wired in, not to add behaviour of
/// its own. Rules live in the use case; mapping lives in the data source.
export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(private readonly source: ReviewDataSource) {}

  fetchQueue(status?: ApplicationStatus): Promise<DoctorReview[]> {
    return this.source.fetchQueue(status);
  }

  fetchSummary(): Promise<QueueSummary> {
    return this.source.fetchSummary();
  }

  fetchApplication(doctorId: string): Promise<DoctorReview | null> {
    return this.source.fetchApplication(doctorId);
  }

  decideDocument(input: {
    doctorId: string;
    documentId: string;
    decision: 'accepted' | 'rejected';
    note?: string;
  }): Promise<DoctorReview> {
    return this.source.decideDocument(input);
  }

  approve(doctorId: string): Promise<DoctorReview> {
    return this.source.approve(doctorId);
  }

  reject(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.source.reject(doctorId, reason);
  }

  requestChanges(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.source.requestChanges(doctorId, reason);
  }

  documentUrl(doctorId: string, documentId: string): Promise<string> {
    return this.source.documentUrl(doctorId, documentId);
  }

  fetchEvents(doctorId?: string): Promise<VerificationEvent[]> {
    return this.source.fetchEvents(doctorId);
  }
}
