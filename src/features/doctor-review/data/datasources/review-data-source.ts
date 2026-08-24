import type { ApplicationStatus, DoctorReview } from '../../domain/entities/doctor-review';
import type { VerificationEvent } from '../../domain/entities/verification-event';
import type { QueueSummary } from '../../domain/repositories/review-repository';

/// Talks to the backend that holds the review queue. Mirrors
/// `AdminRemoteDataSource` in the Flutter app.
export interface ReviewDataSource {
  fetchQueue(status?: ApplicationStatus): Promise<DoctorReview[]>;
  fetchSummary(): Promise<QueueSummary>;
  fetchApplication(doctorId: string): Promise<DoctorReview | null>;
  decideDocument(input: {
    doctorId: string;
    documentId: string;
    decision: 'accepted' | 'rejected';
    note?: string;
  }): Promise<DoctorReview>;
  approve(doctorId: string): Promise<DoctorReview>;
  reject(doctorId: string, reason: string): Promise<DoctorReview>;
  requestChanges(doctorId: string, reason: string): Promise<DoctorReview>;
  documentUrl(doctorId: string, documentId: string): Promise<string>;
  fetchEvents(doctorId?: string): Promise<VerificationEvent[]>;
}
