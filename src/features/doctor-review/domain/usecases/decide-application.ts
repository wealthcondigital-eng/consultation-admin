import { Failure } from '@/core/error/failure';

import {
  MIN_REASON_LENGTH,
  approvalBlockers,
  type DoctorReview,
} from '../entities/doctor-review';
import type { ReviewRepository } from '../repositories/review-repository';

/// Approves, rejects or returns one registration.
///
/// A port of
/// consultation_app/lib/features/admin/domain/usecases/decide_doctor_application.dart. The
/// validation lives here rather than in a screen so the rules hold whichever
/// surface calls them — and it is duplicated in the API on purpose, because a
/// client-side check is a courtesy to the reviewer, not a guarantee.
export class DecideApplication {
  constructor(private readonly repository: ReviewRepository) {}

  static readonly minReasonLength = MIN_REASON_LENGTH;

  async approve(doctorId: string): Promise<DoctorReview> {
    return this.repository.approve(doctorId);
  }

  async reject(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.repository.reject(doctorId, this.requireReason(reason));
  }

  async requestChanges(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.repository.requestChanges(doctorId, this.requireReason(reason));
  }

  /// Accepts one file. Nothing to validate: an acceptance needs no words.
  async acceptDocument(doctorId: string, documentId: string, note?: string) {
    return this.repository.decideDocument({
      doctorId,
      documentId,
      decision: 'accepted',
      note: note?.trim() || undefined,
    });
  }

  /// Rejects one file. The note is required for the same reason an
  /// application-level rejection reason is: the doctor has to know which file
  /// to replace and what was wrong with it.
  async rejectDocument(doctorId: string, documentId: string, note: string) {
    return this.repository.decideDocument({
      doctorId,
      documentId,
      decision: 'rejected',
      note: this.requireReason(note),
    });
  }

  /// Checked before the button is enabled, and again here. Returns the reasons
  /// the reviewer cannot approve yet, empty when they can.
  blockersFor(review: DoctorReview): string[] {
    return approvalBlockers(review);
  }

  private requireReason(reason: string): string {
    const trimmed = reason.trim();

    // A doctor has to know what to fix; "no" on its own sends them back to the
    // same form with the same mistake.
    if (trimmed.length < MIN_REASON_LENGTH) {
      throw new Failure(
        `Give a reason the doctor can act on, of at least ${MIN_REASON_LENGTH} characters.`,
      );
    }

    return trimmed;
  }
}
