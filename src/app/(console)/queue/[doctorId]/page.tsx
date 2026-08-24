import Link from 'next/link';
import { notFound } from 'next/navigation';

import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { dateAndTime, isStale, waitingFor } from '@/core/format/date-format';
import { StatusBadge } from '@/core/widgets/badge';
import { Card, CardHeader, DetailRow } from '@/core/widgets/card';
import { EmptyState } from '@/core/widgets/empty-state';
import { LinkProgress } from '@/core/widgets/link-progress';
import { Reveal } from '@/core/widgets/reveal';
import {
  DOCUMENT_LABELS,
  REQUIRED_DOCUMENTS,
  credentialsLabel,
  documentOfType,
  isVerified,
  locationLabel,
  missingDocuments,
  pendingDocuments,
} from '@/features/doctor-review/domain/entities/doctor-review';
import { DecisionPanel } from '@/features/doctor-review/presentation/widgets/decision-panel';
import { DocumentReviewCard } from '@/features/doctor-review/presentation/widgets/document-review-card';
import { EventTimeline } from '@/features/doctor-review/presentation/widgets/event-timeline';

export const dynamic = 'force-dynamic';

/// One registration, in full: what the doctor typed, every file they uploaded,
/// and the decision panel.
///
/// The screen the whole console exists for. Layout is deliberate — the
/// documents column is the wide one, because reading them is the work; the
/// decision panel is narrow, sticky and last, because deciding is what happens
/// after the work.
export default async function ApplicationPage({
  params,
}: {
  readonly params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;

  let review;
  let events;
  let queue;

  try {
    const { repository } = await reviewGraph();
    [review, events, queue] = await Promise.all([
      repository.fetchApplication(doctorId),
      repository.fetchEvents(doctorId),
      // Fetched so the panel can offer the next application once this one is
      // decided. A reviewer working through a queue should not have to go back
      // to the list and find their place again.
      repository.fetchQueue('under_review'),
    ]);
  } catch (error) {
    return (
      <Card>
        <EmptyState
          tone="error"
          title="This application could not be loaded"
          message={messageFor(error)}
        />
      </Card>
    );
  }

  if (!review) notFound();

  const isDecidable =
    review.status === 'under_review' || review.status === 'changes_requested';
  const missing = missingDocuments(review);
  const outstanding = pendingDocuments(review).length;
  const rejected = REQUIRED_DOCUMENTS.filter(
    (type) => documentOfType(review, type)?.review.decision === 'rejected',
  ).length;
  const stale = review.submittedAt ? isStale(review.submittedAt) : false;

  // The oldest waiting application that is not this one — the queue is already
  // sorted oldest first, so the first match is the right one.
  const next = queue.find((candidate) => candidate.doctorId !== review!.doctorId);

  // Required documents first and in a fixed order, then anything optional. A
  // reviewer working down the list should meet the blocking files first.
  const ordered = [
    ...REQUIRED_DOCUMENTS.map((type) => documentOfType(review, type)).filter(
      (document): document is NonNullable<typeof document> => !!document,
    ),
    ...review.documents.filter((document) => !REQUIRED_DOCUMENTS.includes(document.type)),
  ];

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="animate-fade mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <Link
          href="/queue"
          className="group relative inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] px-2 py-1 -ml-2 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-muted hover:text-primary-deep"
        >
          <LinkProgress />
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Back to queue
        </Link>

        {/* Skipping is a legitimate move — a reviewer may be waiting on the
            council to confirm a number — so the next application is reachable
            without deciding this one. */}
        {next ? (
          <Link
            href={`/queue/${next.doctorId}`}
            className="group relative inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] px-2 py-1 -mr-2 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-muted hover:text-primary-deep"
          >
            <LinkProgress />
            <span className="max-w-[14rem] truncate">Skip to {next.fullName}</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        ) : null}
      </nav>

      {/* The applicant's card. The identity block and the clock sit on one
          surface rather than floating on the canvas: this screen is about one
          person, and the header should say so before anything else does. */}
      <Reveal
        as="header"
        className="mb-5 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="animate-scale-in grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-surface to-info-surface text-lg font-extrabold text-primary-deep ring-1 ring-primary-soft/20"
            >
              {initialsOf(review.fullName)}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-screen-title">{review.fullName}</h1>
                <StatusBadge status={review.status} />
              </div>
              <p className="text-card-subtitle mt-1">{credentialsLabel(review)}</p>
              <p className="text-helper mt-0.5">{locationLabel(review)}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-meta-label">Waiting</p>
            <p
              className={`tabular text-2xl font-extrabold ${
                stale ? 'text-warning' : 'text-text-primary'
              }`}
            >
              {review.submittedAt ? waitingFor(review.submittedAt) : '—'}
            </p>
            <p className="text-xs text-text-tertiary">
              {review.submittedAt
                ? `Submitted ${dateAndTime(review.submittedAt)}`
                : 'Not submitted'}
            </p>
          </div>
        </div>

        {/* A strip across the foot of the header showing where the paperwork
            has got to, one segment per required document. It is the same
            information as the pips in the queue, at the size this screen can
            afford — and it is the first thing a reviewer wants on arriving. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-divider-faint bg-surface-muted px-5 py-3">
          <span className="flex items-center gap-2">
            {REQUIRED_DOCUMENTS.map((type, index) => {
              const decision = documentOfType(review, type)?.review.decision;

              return (
                <span
                  key={type}
                  title={`${DOCUMENT_LABELS[type]}: ${decision ?? 'not uploaded'}`}
                  className={`animate-grow-x h-1.5 w-10 origin-left rounded-full ${
                    decision === 'accepted'
                      ? 'bg-success-strong'
                      : decision === 'rejected'
                        ? 'bg-danger'
                        : decision
                          ? 'bg-warning'
                          : 'bg-border'
                  }`}
                  style={{ animationDelay: `${180 + index * 90}ms` }}
                />
              );
            })}
          </span>

          {/* Ordered by what stops the reviewer soonest: a file that was never
              uploaded, then one that was rejected, then one still to read. The
              first pass ended on "every uploaded document has been decided",
              which is true of an application holding a rejected certificate
              and tells the reviewer nothing about why they cannot approve. */}
          <p className="text-[0.8125rem] text-text-secondary">
            {missing.length > 0
              ? `${missing.length} required document${missing.length === 1 ? '' : 's'} never uploaded`
              : rejected > 0
                ? `${rejected} document${rejected === 1 ? ' was' : 's were'} rejected — approval is blocked until ${rejected === 1 ? 'it is' : 'they are'} replaced`
                : outstanding > 0
                  ? `${outstanding} document${outstanding === 1 ? '' : 's'} still to check`
                  : 'Every required document has been accepted'}
          </p>
        </div>
      </Reveal>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <Reveal delay={80}>
            <Card>
              <CardHeader
                title="Declared details"
                subtitle="Ticked fields were read off the uploaded certificate rather than typed by hand."
                icon={<PersonGlyph />}
              />
              <dl>
                <DetailRow
                  label="Full name"
                  value={review.fullName}
                  verified={isVerified(review, 'fullName')}
                />
                <DetailRow
                  label="Medical degree"
                  value={review.medicalDegree}
                  verified={isVerified(review, 'medicalDegree')}
                />
                <DetailRow
                  label="Registration no."
                  value={review.registrationNumber}
                  verified={isVerified(review, 'registrationNumber')}
                />
                <DetailRow
                  label="Speciality"
                  value={review.specialty}
                  verified={isVerified(review, 'specialty')}
                />
                <DetailRow label="Practises in" value={locationLabel(review)} />
                <DetailRow
                  label="Experience"
                  value={
                    review.yearsOfExperience == null
                      ? null
                      : `${review.yearsOfExperience} years`
                  }
                />
                <DetailRow label="Phone" value={review.phone} />
                <DetailRow label="Email" value={review.email} />
              </dl>

              <p className="text-helper mt-4 border-t border-divider-faint pt-3">
                Payout and bank details are deliberately not shown. Approving
                credentials is no reason to see where someone&apos;s money goes.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={140}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-nav-title">Documents</h2>
              <p className="text-helper">Each file is accepted or rejected on its own.</p>
            </div>

            {missing.length > 0 ? (
              <div className="animate-rise-sm mb-3 flex items-start gap-2.5 rounded-[var(--radius-control)] border border-warning/30 bg-warning-surface px-4 py-3">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-warning">
                  <AlertGlyph />
                </span>
                <div>
                  <p className="text-[0.8125rem] font-bold text-warning">
                    {missing.length} required document
                    {missing.length === 1 ? '' : 's'} never uploaded
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {missing.map((type) => (
                      <li key={type} className="text-[0.8125rem] text-warning">
                        · {DOCUMENT_LABELS[type]}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {ordered.length === 0 ? (
              <Card>
                {/* Worth stating plainly: the reviewer is deciding on typed
                    details with nothing to check them against. */}
                <EmptyState
                  tone="error"
                  title="Nothing was uploaded"
                  message="This application has no documents at all — the details above were entered by hand and cannot be verified against anything."
                />
              </Card>
            ) : (
              <ul className="stagger space-y-3">
                {ordered.map((document) => (
                  <DocumentReviewCard
                    key={document.id}
                    doctorId={review.doctorId}
                    document={document}
                    isDecidable={isDecidable}
                  />
                ))}
              </ul>
            )}
          </Reveal>
        </div>

        {/* Sticky on wide screens: the decision stays reachable while the
            reviewer scrolls a long document list. */}
        <aside className="space-y-5 xl:sticky xl:top-7">
          <Reveal delay={120}>
            <Card>
              <CardHeader title="Decision" icon={<GavelGlyph />} />
              <DecisionPanel
                review={review}
                nextHref={next ? `/queue/${next.doctorId}` : null}
              />
            </Card>
          </Reveal>

          <Reveal delay={180}>
            <Card>
              <CardHeader title="History" subtitle="Append-only." icon={<TrailGlyph />} />
              <EventTimeline events={events} />
            </Card>
          </Reveal>
        </aside>
      </div>
    </>
  );
}

function initialsOf(fullName: string): string {
  return fullName
    .replace(/^Dr\.?\s+/i, '')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function PersonGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.8 17c0-3.2 2.8-5.2 6.2-5.2s6.2 2 6.2 5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GavelGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <path
        d="M3 17h8M11.6 3.4l5 5M13.4 1.6 18.4 6.6M9.8 5.2l5 5M7 8l5 5-2.6 2.6-5-5L7 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrailGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <path
        d="M6 4v12M14 8v4a2 2 0 0 1-2 2H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="3" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AlertGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path d="M8 5v3.5m0 2.2v.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
