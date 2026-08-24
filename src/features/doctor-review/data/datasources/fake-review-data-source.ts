import { Failure } from '@/core/error/failure';

import {
  REQUIRED_DOCUMENTS,
  approvalBlockers,
  documentOfType,
  type ApplicationStatus,
  type DoctorDocument,
  type DoctorReview,
} from '../../domain/entities/doctor-review';
import type {
  VerificationAction,
  VerificationEvent,
} from '../../domain/entities/verification-event';
import type { QueueSummary } from '../../domain/repositories/review-repository';
import type { ReviewDataSource } from './review-data-source';

/// Stand-in with a full queue, so every screen is walkable without a backend.
///
/// The same role as `FakeAdminRemoteDataSource` in the Flutter app, and the
/// same reason for existing: the console is the surface where the review rules
/// live, and those rules need to be exercisable before the API implements
/// them. It mutates its own state, so approving something here really does
/// remove it from the queue for the rest of the dev-server session.
const DAY = 86_400_000;
const HOUR = 3_600_000;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function pdf(
  id: string,
  type: DoctorDocument['type'],
  fileName: string,
  sizeBytes: number,
  uploadedMsAgo: number,
  review: DoctorDocument['review'] = { decision: 'pending' },
): DoctorDocument {
  return {
    id,
    type,
    fileName,
    sizeBytes,
    mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    source: fileName.endsWith('.pdf') ? 'gallery' : 'scan',
    uploadedAt: ago(uploadedMsAgo),
    review,
  };
}

function seed(): DoctorReview[] {
  return [
    {
      doctorId: 'doctor-1',
      fullName: 'Dr. Sarah Jenkins',
      status: 'under_review',
      submittedAt: ago(4 * DAY + 3 * HOUR),
      medicalDegree: 'MD - General Medicine',
      registrationNumber: 'REG-9920-A',
      specialty: 'Internal Medicine',
      state: 'Maharashtra',
      city: 'Mumbai',
      yearsOfExperience: 8,
      phone: '+91 98765 43210',
      email: 'sarah.jenkins@example.com',
      verifiedFields: ['fullName', 'medicalDegree', 'registrationNumber'],
      documents: [
        pdf('doc-1a', 'degree', 'md-general-medicine.pdf', 1_482_112, 4 * DAY),
        pdf('doc-1b', 'registration', 'mmc-registration.pdf', 730_112, 4 * DAY),
        pdf('doc-1c', 'id_proof', 'aadhaar-front.jpg', 412_000, 4 * DAY),
        pdf('doc-1d', 'photo', 'headshot.jpg', 220_400, 4 * DAY),
      ],
    },
    {
      doctorId: 'doctor-2',
      fullName: 'Dr. Vinay Kumar',
      status: 'under_review',
      submittedAt: ago(2 * DAY + 6 * HOUR),
      medicalDegree: 'MD - Cardiology',
      registrationNumber: 'REG-4471-C',
      specialty: 'Cardiology',
      state: 'Karnataka',
      city: 'Bengaluru',
      yearsOfExperience: 15,
      phone: '+91 91234 56789',
      email: 'vinay.kumar@example.com',
      verifiedFields: ['fullName', 'medicalDegree'],
      documents: [
        pdf('doc-2a', 'degree', 'md-cardiology.pdf', 2_140_000, 2 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(2 * DAY - 4 * HOUR),
        }),
        pdf('doc-2b', 'registration', 'kmc-registration.pdf', 690_000, 2 * DAY),
        pdf('doc-2c', 'id_proof', 'pan-card.jpg', 318_000, 2 * DAY),
      ],
    },
    {
      // Every required document already accepted — the state that makes the
      // approve action available, so the happy path is demonstrable.
      doctorId: 'doctor-3',
      fullName: 'Dr. Ananya Rao',
      status: 'under_review',
      submittedAt: ago(1 * DAY + 2 * HOUR),
      medicalDegree: 'MBBS',
      registrationNumber: 'REG-2210-K',
      specialty: 'Paediatrics',
      state: 'Telangana',
      city: 'Hyderabad',
      yearsOfExperience: 6,
      phone: '+91 99880 11223',
      email: 'ananya.rao@example.com',
      verifiedFields: [
        'fullName',
        'medicalDegree',
        'registrationNumber',
        'specialty',
      ],
      documents: [
        pdf('doc-3a', 'degree', 'mbbs-certificate.pdf', 1_120_000, 1 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(20 * HOUR),
        }),
        pdf('doc-3b', 'registration', 'tsmc-registration.pdf', 640_000, 1 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(19 * HOUR),
        }),
        pdf('doc-3c', 'id_proof', 'passport.jpg', 502_000, 1 * DAY, {
          decision: 'accepted',
          note: 'Matches the name on the degree certificate.',
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(19 * HOUR),
        }),
        pdf('doc-3d', 'photo', 'profile.jpg', 180_000, 1 * DAY),
      ],
    },
    {
      // No government ID at all — shows the blocker for a document that was
      // never uploaded, as distinct from one not yet reviewed.
      doctorId: 'doctor-4',
      fullName: 'Dr. Imran Sheikh',
      status: 'under_review',
      submittedAt: ago(9 * HOUR),
      medicalDegree: 'MS - General Surgery',
      registrationNumber: 'REG-7788-D',
      specialty: 'General Surgery',
      state: 'Delhi',
      city: 'New Delhi',
      yearsOfExperience: 12,
      phone: '+91 90000 22334',
      email: 'imran.sheikh@example.com',
      verifiedFields: ['fullName'],
      documents: [
        pdf('doc-4a', 'degree', 'ms-general-surgery.pdf', 1_760_000, 9 * HOUR),
        pdf('doc-4b', 'registration', 'dmc-registration.pdf', 705_000, 9 * HOUR),
      ],
    },
    {
      doctorId: 'doctor-5',
      fullName: 'Dr. Meera Nair',
      status: 'changes_requested',
      submittedAt: ago(6 * DAY),
      medicalDegree: 'MD - Dermatology',
      registrationNumber: 'REG-5512-M',
      specialty: 'Dermatology',
      state: 'Kerala',
      city: 'Kochi',
      yearsOfExperience: 9,
      phone: '+91 97777 55443',
      email: 'meera.nair@example.com',
      verifiedFields: ['fullName', 'medicalDegree'],
      rejectionReason:
        'The council registration scan is cut off at the bottom — please re-upload the full page.',
      reviewedAt: ago(5 * DAY),
      reviewedByName: 'Priya Menon',
      documents: [
        pdf('doc-5a', 'degree', 'md-dermatology.pdf', 1_310_000, 6 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(5 * DAY),
        }),
        pdf('doc-5b', 'registration', 'kmc-registration-partial.jpg', 288_000, 6 * DAY, {
          decision: 'rejected',
          note: 'The bottom of the page is missing, including the registration date.',
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(5 * DAY),
        }),
        pdf('doc-5c', 'id_proof', 'voter-id.jpg', 366_000, 6 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(5 * DAY),
        }),
      ],
    },
    {
      doctorId: 'doctor-6',
      fullName: 'Dr. Rohit Verma',
      status: 'approved',
      submittedAt: ago(11 * DAY),
      medicalDegree: 'MD - Neurology',
      registrationNumber: 'REG-3301-N',
      specialty: 'Neurology',
      state: 'Maharashtra',
      city: 'Pune',
      yearsOfExperience: 18,
      phone: '+91 93333 77889',
      email: 'rohit.verma@example.com',
      verifiedFields: ['fullName', 'medicalDegree', 'registrationNumber', 'specialty'],
      reviewedAt: ago(9 * DAY),
      reviewedByName: 'Priya Menon',
      documents: [
        pdf('doc-6a', 'degree', 'md-neurology.pdf', 1_900_000, 11 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(9 * DAY),
        }),
        pdf('doc-6b', 'registration', 'mmc-registration.pdf', 712_000, 11 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(9 * DAY),
        }),
        pdf('doc-6c', 'id_proof', 'aadhaar.jpg', 401_000, 11 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Priya Menon',
          reviewedAt: ago(9 * DAY),
        }),
      ],
    },
    {
      doctorId: 'doctor-7',
      fullName: 'Dr. Kavita Desai',
      status: 'rejected',
      submittedAt: ago(14 * DAY),
      medicalDegree: 'MBBS',
      registrationNumber: 'REG-1188-X',
      specialty: 'General Practice',
      state: 'Gujarat',
      city: 'Ahmedabad',
      yearsOfExperience: 4,
      phone: '+91 96666 12345',
      email: 'kavita.desai@example.com',
      verifiedFields: [],
      rejectionReason:
        'The registration number could not be found on the state council register. Please confirm the number and re-apply.',
      reviewedAt: ago(12 * DAY),
      reviewedByName: 'Arun Shetty',
      documents: [
        pdf('doc-7a', 'degree', 'mbbs.pdf', 990_000, 14 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Arun Shetty',
          reviewedAt: ago(12 * DAY),
        }),
        pdf('doc-7b', 'registration', 'registration.pdf', 540_000, 14 * DAY, {
          decision: 'rejected',
          note: 'Number does not appear on the Gujarat Medical Council register.',
          reviewedByName: 'Arun Shetty',
          reviewedAt: ago(12 * DAY),
        }),
        pdf('doc-7c', 'id_proof', 'driving-licence.jpg', 340_000, 14 * DAY, {
          decision: 'accepted',
          note: null,
          reviewedByName: 'Arun Shetty',
          reviewedAt: ago(12 * DAY),
        }),
      ],
    },
  ];
}

/// Held on `globalThis` so the dev server's module reloads do not reset the
/// queue mid-review, which makes the fake maddening to click through.
interface FakeStore {
  applications: DoctorReview[];
  events: VerificationEvent[];
  nextEventId: number;
}

const globalStore = globalThis as unknown as { __adminFakeStore?: FakeStore };

function store(): FakeStore {
  if (!globalStore.__adminFakeStore) {
    const applications = seed();
    globalStore.__adminFakeStore = {
      applications,
      events: applications
        .filter((application) => application.submittedAt)
        .map((application, index) => ({
          id: `event-seed-${index}`,
          doctorId: application.doctorId,
          doctorName: application.fullName,
          action: 'submitted' as VerificationAction,
          at: application.submittedAt as string,
          actorName: null,
          note: null,
        })),
      nextEventId: 0,
    };
  }
  return globalStore.__adminFakeStore;
}

const LATENCY_MS = 260;

function settle<T>(value: T): Promise<T> {
  // A real spinner is worth seeing while building the screens.
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

export class FakeReviewDataSource implements ReviewDataSource {
  constructor(private readonly actorName: string) {}

  async fetchQueue(status?: ApplicationStatus): Promise<DoctorReview[]> {
    const all = store().applications;

    const filtered = status
      ? all.filter((application) => application.status === status)
      : all.filter(
          (application) =>
            application.status === 'under_review' ||
            application.status === 'changes_requested',
        );

    // Oldest first: a queue that reorders itself leaves the earliest applicant
    // waiting longest.
    const sorted = [...filtered].sort(
      (a, b) => Date.parse(a.submittedAt ?? '') - Date.parse(b.submittedAt ?? ''),
    );

    return settle(sorted);
  }

  async fetchSummary(): Promise<QueueSummary> {
    const all = store().applications;
    const week = Date.now() - 7 * DAY;

    const waiting = all.filter((a) => a.status === 'under_review');
    const oldest = waiting.reduce((worst, application) => {
      const at = Date.parse(application.submittedAt ?? '');
      return Number.isNaN(at) ? worst : Math.min(worst, at);
    }, Date.now());

    return settle({
      pending: waiting.length,
      changesRequested: all.filter((a) => a.status === 'changes_requested').length,
      approvedThisWeek: all.filter(
        (a) => a.status === 'approved' && Date.parse(a.reviewedAt ?? '') >= week,
      ).length,
      rejectedThisWeek: all.filter(
        (a) => a.status === 'rejected' && Date.parse(a.reviewedAt ?? '') >= week,
      ).length,
      oldestWaitingHours: Math.max(0, Math.round((Date.now() - oldest) / HOUR)),
    });
  }

  async fetchApplication(doctorId: string): Promise<DoctorReview | null> {
    const found = store().applications.find((a) => a.doctorId === doctorId) ?? null;
    return settle(found);
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
    const application = this.require(doctorId);
    const document = application.documents.find((d) => d.id === documentId);

    if (!document) throw new Failure('That document is no longer attached.');
    if (decision === 'rejected' && !note) {
      throw new Failure('Say what is wrong with the document.');
    }

    const updated: DoctorReview = {
      ...application,
      documents: application.documents.map((current) =>
        current.id === documentId
          ? {
              ...current,
              review: {
                decision,
                note: note ?? null,
                reviewedByName: this.actorName,
                reviewedAt: new Date().toISOString(),
              },
            }
          : current,
      ),
    };

    this.replace(updated);
    this.record(updated, decision === 'accepted' ? 'document_accepted' : 'document_rejected', {
      note: note ?? null,
      documentType: document.type,
    });

    return settle(updated);
  }

  async approve(doctorId: string): Promise<DoctorReview> {
    const application = this.require(doctorId);

    // The same check the API must make. The console disables the button, but a
    // disabled button is a courtesy, not a guarantee.
    const blockers = approvalBlockers(application);
    if (blockers.length > 0) {
      throw new Failure(blockers[0] ?? 'This application cannot be approved yet.');
    }

    const updated: DoctorReview = {
      ...application,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedByName: this.actorName,
      // Clears a reason left over from an earlier decision.
      rejectionReason: null,
    };

    this.replace(updated);
    this.record(updated, 'approved', { note: null });
    return settle(updated);
  }

  async reject(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.close(doctorId, 'rejected', reason);
  }

  async requestChanges(doctorId: string, reason: string): Promise<DoctorReview> {
    return this.close(doctorId, 'changes_requested', reason);
  }

  async documentUrl(doctorId: string, documentId: string): Promise<string> {
    const application = this.require(doctorId);
    const document = application.documents.find((d) => d.id === documentId);
    if (!document) throw new Failure('That document is no longer attached.');

    // The fake serves a generated placeholder from this app's own routes, so
    // the viewer is real even though the file is not.
    return settle(`/api/documents/${doctorId}/${documentId}/preview`);
  }

  async fetchEvents(doctorId?: string): Promise<VerificationEvent[]> {
    const all = store().events;
    const filtered = doctorId ? all.filter((event) => event.doctorId === doctorId) : all;

    return settle(
      [...filtered].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    );
  }

  // --- internals -----------------------------------------------------------

  private async close(
    doctorId: string,
    status: Extract<ApplicationStatus, 'rejected' | 'changes_requested'>,
    reason: string,
  ): Promise<DoctorReview> {
    const application = this.require(doctorId);

    const updated: DoctorReview = {
      ...application,
      status,
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedByName: this.actorName,
    };

    this.replace(updated);
    this.record(updated, status === 'rejected' ? 'rejected' : 'changes_requested', {
      note: reason,
    });

    return settle(updated);
  }

  private require(doctorId: string): DoctorReview {
    const found = store().applications.find((a) => a.doctorId === doctorId);
    if (!found) throw new Failure('That application no longer exists.');
    return found;
  }

  private replace(updated: DoctorReview): void {
    const state = store();
    state.applications = state.applications.map((application) =>
      application.doctorId === updated.doctorId ? updated : application,
    );
  }

  /// Appends to the audit trail. Never updates an existing entry — the whole
  /// point of the collection is that it only grows.
  private record(
    application: DoctorReview,
    action: VerificationAction,
    extra: { note: string | null; documentType?: DoctorDocument['type'] },
  ): void {
    const state = store();
    state.events.push({
      id: `event-${(state.nextEventId += 1)}`,
      doctorId: application.doctorId,
      doctorName: application.fullName,
      action,
      at: new Date().toISOString(),
      actorName: this.actorName,
      note: extra.note,
      documentType: extra.documentType ?? null,
    });
  }
}

/// Exposed for the overview tile that names what is missing across the queue.
export function requiredDocumentTypes() {
  return REQUIRED_DOCUMENTS;
}

export { documentOfType };
