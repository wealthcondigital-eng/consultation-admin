/// A submitted doctor registration, as the reviewer sees it.
///
/// A port of consultation_app/lib/features/admin/domain/entities/doctor_review.dart, with two
/// deliberate differences.
///
/// **These are interfaces, not classes, and the helpers below are free
/// functions rather than getters.** An entity crossing from a server component
/// to a client component is serialised as plain JSON, and a class instance does
/// not survive that trip — its methods are gone on the other side. Modelling
/// the data as plain objects makes that boundary safe by construction rather
/// than by remembering.
///
/// **It carries `documents`.** The Flutter entity has a single
/// `certificatePath`, matching the one-certificate column in the old Postgres
/// schema. A registration is actually several files, each of which the
/// administrator accepts or rejects on its own, so that is what this models.
///
/// Still deliberately excludes payout details: approving credentials is no
/// reason to see where someone's money goes.

/// Where a registration has got to. Adds `changes_requested` to the four
/// statuses in `DoctorApplicationStatus` — the case where one document is wrong
/// and the rest are fine, which a flat reject throws away.
export type ApplicationStatus =
  | 'draft'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

/// The individually fillable parts of a doctor's credentials. Mirrors
/// `DoctorCredentialField`, and drives the ticks against auto-filled fields.
export type CredentialField =
  | 'fullName'
  | 'medicalDegree'
  | 'registrationNumber'
  | 'specialty'
  | 'state'
  | 'city'
  | 'yearsOfExperience';

export type DocumentType = 'degree' | 'registration' | 'id_proof' | 'photo';

/// Where the doctor got the file from. Mirrors `CertificateSource`.
export type DocumentSource = 'scan' | 'gallery';

/// Per-document outcome. This is the heart of the console: an application is
/// not one yes/no, it is one decision per file.
export type DocumentDecision = 'pending' | 'accepted' | 'rejected';

export interface DocumentReview {
  readonly decision: DocumentDecision;
  /// Why it was rejected, or a note left on an acceptance. Required on a
  /// rejection, for the same reason the application-level reason is.
  readonly note?: string | null;
  readonly reviewedByName?: string | null;
  readonly reviewedAt?: string | null;
}

export interface DoctorDocument {
  readonly id: string;
  readonly type: DocumentType;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly source: DocumentSource;
  readonly uploadedAt: string;
  readonly review: DocumentReview;
}

export interface DoctorReview {
  readonly doctorId: string;
  readonly fullName: string;
  readonly status: ApplicationStatus;
  readonly submittedAt: string | null;

  readonly medicalDegree?: string | null;
  readonly registrationNumber?: string | null;
  readonly specialty?: string | null;
  readonly state?: string | null;
  readonly city?: string | null;
  readonly yearsOfExperience?: number | null;

  readonly phone?: string | null;
  readonly email?: string | null;

  /// Which fields were read off the certificate rather than typed by hand.
  readonly verifiedFields: readonly CredentialField[];

  readonly documents: readonly DoctorDocument[];

  readonly rejectionReason?: string | null;
  readonly reviewedAt?: string | null;
  readonly reviewedByName?: string | null;
}

// --- Rules -----------------------------------------------------------------

/// What a registration cannot be approved without. A profile photo is not on
/// the list: a missing headshot is a cosmetic gap, not a credentialing one.
export const REQUIRED_DOCUMENTS: readonly DocumentType[] = [
  'degree',
  'registration',
  'id_proof',
];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  degree: 'Medical degree certificate',
  registration: 'Council registration',
  id_proof: 'Government photo ID',
  photo: 'Profile photograph',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  under_review: 'Under review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

/// The shortest rejection reason that is any use to the doctor. Matches
/// `DecideDoctorApplication.minReasonLength` exactly — if one changes, change
/// both, because the API enforces its own copy.
export const MIN_REASON_LENGTH = 10;

// --- Derived labels --------------------------------------------------------

/// `Mumbai, Maharashtra` — whichever parts are known.
export function locationLabel(review: DoctorReview): string {
  const parts = [review.city, review.state].filter(
    (part): part is string => !!part && part.length > 0,
  );
  return parts.length === 0 ? 'Location not given' : parts.join(', ');
}

/// `MBBS · Cardiology · 12 yrs`
export function credentialsLabel(review: DoctorReview): string {
  const parts: string[] = [];
  if (review.medicalDegree) parts.push(review.medicalDegree);
  if (review.specialty) parts.push(review.specialty);
  if (review.yearsOfExperience != null) parts.push(`${review.yearsOfExperience} yrs`);
  return parts.length === 0 ? 'No credentials given' : parts.join(' · ');
}

export function isVerified(review: DoctorReview, field: CredentialField): boolean {
  return review.verifiedFields.includes(field);
}

export function documentOfType(
  review: DoctorReview,
  type: DocumentType,
): DoctorDocument | undefined {
  return review.documents.find((document) => document.type === type);
}

/// Required document types with nothing uploaded against them.
export function missingDocuments(review: DoctorReview): DocumentType[] {
  return REQUIRED_DOCUMENTS.filter((type) => !documentOfType(review, type));
}

/// Uploaded documents still awaiting a decision.
export function pendingDocuments(review: DoctorReview): DoctorDocument[] {
  return review.documents.filter((document) => document.review.decision === 'pending');
}

export function rejectedDocuments(review: DoctorReview): DoctorDocument[] {
  return review.documents.filter((document) => document.review.decision === 'rejected');
}

/// Why the approve action is not available yet, as sentences fit to show.
///
/// The rule the whole screen turns on: an application flips to approved only
/// once every *required* document has been accepted on its own. Nothing lets a
/// reviewer approve a doctor whose degree certificate they never opened — that
/// is the difference between a review and a rubber stamp.
export function approvalBlockers(review: DoctorReview): string[] {
  const blockers: string[] = [];

  for (const type of missingDocuments(review)) {
    blockers.push(`${DOCUMENT_LABELS[type]} has not been uploaded.`);
  }

  for (const type of REQUIRED_DOCUMENTS) {
    const document = documentOfType(review, type);
    if (!document) continue;

    if (document.review.decision === 'pending') {
      blockers.push(`${DOCUMENT_LABELS[type]} has not been reviewed yet.`);
    }
    if (document.review.decision === 'rejected') {
      blockers.push(`${DOCUMENT_LABELS[type]} was rejected.`);
    }
  }

  return blockers;
}

export function canApprove(review: DoctorReview): boolean {
  return approvalBlockers(review).length === 0;
}

/// `1.4 MB` — mirrors `MedicalCertificate.sizeLabel`.
export function sizeLabel(sizeBytes: number): string {
  const megabyte = 1024 * 1024;
  if (sizeBytes >= megabyte) return `${(sizeBytes / megabyte).toFixed(1)} MB`;
  return `${Math.round(sizeBytes / 1024)} KB`;
}

/// Whether the built-in viewer can show this file, or the reviewer has to
/// download it. PDFs and images cover everything the app accepts.
export function isViewableInline(document: DoctorDocument): boolean {
  return document.mimeType === 'application/pdf' || document.mimeType.startsWith('image/');
}
