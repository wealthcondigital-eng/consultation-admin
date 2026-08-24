import type { DocumentType } from './doctor-review';

/// One entry in the append-only record of what reviewers did.
///
/// Never updated and never deleted. This is medical credentialing: you will be
/// asked who approved a given doctor, when, and on the strength of which
/// documents — and a mutable `reviewed_by` column on the doctor record answers
/// only the most recent third of that question.
export type VerificationAction =
  | 'submitted'
  | 'document_accepted'
  | 'document_rejected'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'reopened';

export interface VerificationEvent {
  readonly id: string;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly action: VerificationAction;
  readonly at: string;

  /// Null for `submitted`, which the doctor does rather than an administrator.
  readonly actorName: string | null;

  /// Set on the two document-level actions.
  readonly documentType?: DocumentType | null;

  /// The reason or note recorded with the action.
  readonly note?: string | null;
}

export const ACTION_LABELS: Record<VerificationAction, string> = {
  submitted: 'Application submitted',
  document_accepted: 'Document accepted',
  document_rejected: 'Document rejected',
  changes_requested: 'Changes requested',
  approved: 'Application approved',
  rejected: 'Application rejected',
  reopened: 'Reopened for review',
};

/// How an action reads in the timeline: a decision, a step forward, or a
/// refusal. Drives nothing but colour, and is kept out of the UI so both the
/// audit page and the application timeline agree.
export function actionTone(action: VerificationAction): 'positive' | 'negative' | 'neutral' {
  switch (action) {
    case 'approved':
    case 'document_accepted':
      return 'positive';
    case 'rejected':
    case 'document_rejected':
      return 'negative';
    default:
      return 'neutral';
  }
}
