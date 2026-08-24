import type { ApplicationStatus, DoctorReview } from '../entities/doctor-review';
import type { VerificationEvent } from '../entities/verification-event';

/// Counts for the overview tiles. Computed by the backend rather than by
/// filtering a fetched queue — the console must not have to load every
/// application to say how many there are.
export interface QueueSummary {
  readonly pending: number;
  readonly changesRequested: number;
  readonly approvedThisWeek: number;
  readonly rejectedThisWeek: number;

  /// Longest a waiting application has been waiting, in hours. The one number
  /// that says whether the queue is healthy.
  readonly oldestWaitingHours: number;
}

/// Contract for reviewing doctor registrations.
///
/// A port of consultation_app/lib/features/admin/domain/repositories/admin_repository.dart,
/// widened for the two things a console does that a phone screen did not:
/// per-document decisions, and reading the audit trail.
export interface ReviewRepository {
  /// Registrations waiting on a decision, oldest first — the queue is a queue.
  fetchQueue(status?: ApplicationStatus): Promise<DoctorReview[]>;

  fetchSummary(): Promise<QueueSummary>;

  /// One application in full, with its documents. Null when the id matches
  /// nothing the caller may see.
  fetchApplication(doctorId: string): Promise<DoctorReview | null>;

  /// Accept or reject a single uploaded file. `note` is required on a
  /// rejection: the doctor has to know which file to replace and why.
  decideDocument(input: {
    doctorId: string;
    documentId: string;
    decision: 'accepted' | 'rejected';
    note?: string;
  }): Promise<DoctorReview>;

  /// Approves the whole registration. Fails unless every required document has
  /// already been accepted — the API enforces this too, and is the authority.
  approve(doctorId: string): Promise<DoctorReview>;

  /// `reason` is required: a rejection the doctor cannot act on is a dead end.
  reject(doctorId: string, reason: string): Promise<DoctorReview>;

  /// Sends it back for another go without closing it. The outcome when one
  /// document is wrong and the rest are fine.
  requestChanges(doctorId: string, reason: string): Promise<DoctorReview>;

  /// A short-lived link to an uploaded document, for opening in a viewer.
  documentUrl(doctorId: string, documentId: string): Promise<string>;

  /// The audit trail, newest first. `doctorId` narrows it to one application.
  fetchEvents(doctorId?: string): Promise<VerificationEvent[]>;
}
