import Link from 'next/link';

import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { dateAndTime, waitingFor } from '@/core/format/date-format';
import { Card, CardHeader } from '@/core/widgets/card';
import { EmptyState } from '@/core/widgets/empty-state';
import { LinkProgress } from '@/core/widgets/link-progress';
import { HeaderStat, PageHeader } from '@/core/widgets/page-header';
import { Reveal } from '@/core/widgets/reveal';
import { StatTile } from '@/core/widgets/stat-tile';
import {
  REQUIRED_DOCUMENTS,
  canApprove,
  credentialsLabel,
  documentOfType,
  pendingDocuments,
  type DoctorReview,
} from '@/features/doctor-review/domain/entities/doctor-review';
import {
  ACTION_LABELS,
  actionTone,
  type VerificationEvent,
} from '@/features/doctor-review/domain/entities/verification-event';
import type { QueueSummary } from '@/features/doctor-review/domain/repositories/review-repository';

export const dynamic = 'force-dynamic';

/// The landing screen: how big the queue is, how long the oldest applicant has
/// been waiting, and what has been decided lately.
///
/// Deliberately not a chart. Four numbers and two lists answer the questions a
/// reviewer opens this tool with; a dashboard of graphs would answer none of
/// them faster. What the numbers gained in this pass is *context* — a meter
/// under a count, a name under a duration — because a figure with nothing to
/// compare it against is a figure nobody acts on.
///
/// The fetch is wrapped in try/catch and the markup is not. JSX built inside a
/// `try` is a trap: React renders the component after this function returns, so
/// an error thrown during that render escapes the catch entirely and the
/// handler gives false confidence.
export default async function OverviewPage() {
  let summary: QueueSummary;
  let queue: DoctorReview[];
  let events: VerificationEvent[];
  let firstName: string;

  try {
    const { repository, session } = await reviewGraph();
    [summary, queue, events] = await Promise.all([
      repository.fetchSummary(),
      repository.fetchQueue('under_review'),
      repository.fetchEvents(),
    ]);
    firstName = session.fullName.split(' ')[0] ?? 'there';
  } catch (error) {
    return (
      <Card>
        <EmptyState
          tone="error"
          title="The queue could not be loaded"
          message={messageFor(error)}
        />
      </Card>
    );
  }

  const oldest = queue[0];
  const decided = events.filter((event) => event.action !== 'submitted').slice(0, 6);
  const returnedOrRejected = summary.rejectedThisWeek + summary.changesRequested;
  const ready = queue.filter(canApprove).length;
  const openTotal = summary.pending + summary.changesRequested;

  // Days once the wait passes a day, hours below that. Two units rather than
  // one because "72h" is a number a reviewer has to divide before it means
  // anything, and "3d" is one they already understand.
  const waitInDays = summary.oldestWaitingHours >= 24;

  return (
    <>
      <PageHeader
        eyebrow={todayLabel()}
        title={`${greeting()}, ${firstName}`}
        subtitle={
          summary.pending === 0
            ? 'Nothing is waiting on a decision. The queue is clear.'
            : `${summary.pending} registration${summary.pending === 1 ? '' : 's'} waiting on a decision${
                ready > 0 ? `, and ${ready} of them can be decided right now.` : '.'
              }`
        }
      >
        <div className="flex flex-wrap gap-2">
          <HeaderStat value={summary.pending} label="waiting" tone="info" delay={160} />
          <HeaderStat
            value={ready}
            label="ready to approve"
            tone={ready > 0 ? 'positive' : 'neutral'}
            delay={200}
          />
          <HeaderStat
            value={summary.changesRequested}
            label="awaiting re-upload"
            tone={summary.changesRequested > 0 ? 'caution' : 'neutral'}
            delay={240}
          />
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Awaiting review"
          value={summary.pending}
          tone={summary.pending > 0 ? 'info' : 'neutral'}
          icon={<InboxGlyph />}
          hint={summary.pending > 0 ? 'Oldest first' : 'Queue is clear'}
          href="/queue"
          meter={
            openTotal > 0
              ? {
                  value: ready,
                  max: openTotal,
                  label: `${ready} of ${openTotal} open can be decided now`,
                }
              : undefined
          }
          delay={0}
        />
        <StatTile
          label="Longest wait"
          value={
            waitInDays
              ? Math.floor(summary.oldestWaitingHours / 24)
              : summary.oldestWaitingHours
          }
          suffix={waitInDays ? 'd' : 'h'}
          // Amber past three days: the point at which an applicant has been
          // waiting long enough to chase, matching `isStale`.
          tone={summary.oldestWaitingHours >= 72 ? 'caution' : 'neutral'}
          icon={<ClockGlyph />}
          hint={oldest ? oldest.fullName : 'Nothing waiting'}
          href={oldest ? `/queue/${oldest.doctorId}` : '/queue'}
          delay={60}
        />
        <StatTile
          label="Approved this week"
          value={summary.approvedThisWeek}
          tone="positive"
          icon={<CheckGlyph />}
          hint="Now taking consultations"
          href="/decided?status=approved"
          delay={120}
        />
        <StatTile
          label="Returned or rejected"
          value={returnedOrRejected}
          tone={returnedOrRejected > 0 ? 'negative' : 'neutral'}
          icon={<ReturnGlyph />}
          hint={`${summary.changesRequested} awaiting re-upload`}
          href="/decided?status=rejected"
          delay={180}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal delay={220}>
          <Card>
            <CardHeader
              title="Next in the queue"
              subtitle="Oldest first — the earliest applicant has waited longest."
              icon={<QueueGlyph />}
              action={
                <Link
                  href="/queue"
                  className="group relative inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-1 text-sm font-semibold text-primary-vivid transition-colors duration-200 hover:bg-primary-surface"
                >
                  <LinkProgress />
                  Open queue
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              }
            />

            {queue.length === 0 ? (
              <p className="text-card-subtitle py-6 text-center">
                Nothing is waiting on a decision.
              </p>
            ) : (
              <ul className="stagger divide-y divide-divider-faint">
                {queue.slice(0, 5).map((review) => (
                  <QueueRow key={review.doctorId} review={review} />
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        <Reveal delay={280}>
          <Card>
            <CardHeader
              title="Recent decisions"
              subtitle="Append-only. Nothing here can be edited or removed."
              icon={<TrailGlyph />}
              action={
                <Link
                  href="/audit"
                  className="group relative inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-1 text-sm font-semibold text-primary-vivid transition-colors duration-200 hover:bg-primary-surface"
                >
                  <LinkProgress />
                  Full trail
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              }
            />

            {decided.length === 0 ? (
              <p className="text-card-subtitle py-6 text-center">
                No decisions recorded yet.
              </p>
            ) : (
              <ul className="stagger relative space-y-3.5 pl-5">
                {/* One rail behind all the dots rather than a segment per row,
                    so it does not break between items. */}
                <span
                  aria-hidden="true"
                  className="absolute top-2 bottom-2 left-[0.1875rem] w-px bg-gradient-to-b from-border via-border to-transparent"
                />
                {decided.map((event) => (
                  <DecisionRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      </div>
    </>
  );
}

/// One waiting applicant. The row carries three things the first pass left to
/// the detail screen: who they are, how far through their paperwork is, and how
/// long they have been waiting — which together are enough to decide whether to
/// open this one or the one below it.
function QueueRow({ review }: { readonly review: DoctorReview }) {
  const outstanding = pendingDocuments(review).length;
  const ready = canApprove(review);

  return (
    <li>
      <Link
        href={`/queue/${review.doctorId}`}
        className="group relative -mx-2 flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-3 transition-colors duration-200 hover:bg-surface-muted"
      >
        <LinkProgress />

        <span
          aria-hidden="true"
          className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105 ${
            ready
              ? 'bg-badge-surface text-success ring-1 ring-success/20'
              : 'bg-surface-muted text-text-secondary ring-1 ring-border'
          }`}
        >
          {initialsOf(review.fullName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary transition-colors duration-200 group-hover:text-primary-deep">
            {review.fullName}
          </p>
          <p className="text-helper truncate">{credentialsLabel(review)}</p>
        </div>

        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          {REQUIRED_DOCUMENTS.map((type) => {
            const decision = documentOfType(review, type)?.review.decision;
            return (
              <span
                key={type}
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  decision === 'accepted'
                    ? 'bg-success-strong'
                    : decision === 'rejected'
                      ? 'bg-danger'
                      : decision
                        ? 'bg-warning'
                        : 'bg-border'
                }`}
              />
            );
          })}
        </span>

        <div className="shrink-0 text-right">
          <p className="tabular text-sm font-semibold text-text-label">
            {review.submittedAt ? waitingFor(review.submittedAt) : '—'}
          </p>
          <p
            className={`text-xs ${ready ? 'font-semibold text-success' : 'text-text-tertiary'}`}
          >
            {ready
              ? 'ready to decide'
              : outstanding === 0
                ? 'see detail'
                : `${outstanding} doc${outstanding === 1 ? '' : 's'} to check`}
          </p>
        </div>
      </Link>
    </li>
  );
}

function DecisionRow({ event }: { readonly event: VerificationEvent }) {
  const tone = actionTone(event.action);

  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={`absolute top-1.5 -left-5 size-2 rounded-full ring-2 ring-surface ${
          tone === 'positive'
            ? 'bg-success-strong'
            : tone === 'negative'
              ? 'bg-danger'
              : 'bg-text-tertiary'
        }`}
      />
      <p className="text-sm text-text-label">
        <Link
          href={`/queue/${event.doctorId}`}
          className="font-semibold text-text-primary transition-colors duration-200 hover:text-primary-deep hover:underline"
        >
          {event.doctorName}
        </Link>{' '}
        — {ACTION_LABELS[event.action].toLowerCase()}
      </p>
      <p className="text-xs text-text-tertiary">
        {event.actorName ?? 'the applicant'} · {dateAndTime(event.at)}
      </p>
    </li>
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

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/// The date, spelled out. On a screen whose whole subject is how long people
/// have been waiting, saying what day it is costs one line and saves the
/// reviewer checking the corner of their screen.
function todayLabel(): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

function InboxGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M2.5 11h3l1.2 2.4h6.6L14.5 11h3M4 4h12l1.5 7v4a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 15v-4L4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.8 10.2 9 12.4l4-4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReturnGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M7.5 4 3.8 7.7l3.7 3.7M4 7.7h7.2a4.6 4.6 0 0 1 0 9.2H6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QueueGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
