import Link from 'next/link';

import { monthDayYear, isStale, waitingFor } from '@/core/format/date-format';
import { StatusBadge } from '@/core/widgets/badge';
import { LinkProgress } from '@/core/widgets/link-progress';
import {
  DOCUMENT_LABELS,
  REQUIRED_DOCUMENTS,
  canApprove,
  credentialsLabel,
  documentOfType,
  locationLabel,
  missingDocuments,
  pendingDocuments,
  type DoctorReview,
} from '@/features/doctor-review/domain/entities/doctor-review';

/// The queue, in two shapes for two widths.
///
/// A table rather than the card list the phone app uses, because the console's
/// job is different: a reviewer scanning fifty applications needs to compare
/// down a column — who has waited longest, who is missing paperwork — and cards
/// make that impossible.
///
/// But a table eight columns wide on a 900px window is a table nobody can read
/// without dragging it sideways, and the first pass simply let it overflow. So
/// below `lg` the same rows render as cards. Not a fallback: it is the same
/// information, laid out for a width where columns stop being an advantage.
///
/// The one thing carried over from the phone design is that the queue is sorted
/// oldest first and never reorders itself.
export function QueueTable({
  reviews,
  decided = false,
}: {
  readonly reviews: readonly DoctorReview[];
  /// True on the Decided screen. Without it the table treats a closed
  /// application like an open one — an approved doctor whose documents were
  /// all accepted satisfies `canApprove`, so the row offered a blue **Decide**
  /// button for a decision already made, and counted the days since submission
  /// as though somebody were still waiting on it. Both were wrong, and both
  /// were wrong in the direction that gets a reviewer to click.
  readonly decided?: boolean;
}) {
  return (
    <>
      {/* The table scrolls inside this container; the page never scrolls
          sideways. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[66rem] border-collapse text-left">
          <thead>
            {/* Sticky, because a reviewer who has scrolled to row thirty has
                lost the column headings exactly when they need them. */}
            <tr className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
              {[
                'Applicant',
                'Credentials',
                'Registration',
                'Practises in',
                'Documents',
                decided ? 'Decided' : 'Waiting',
                'Status',
                '',
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="text-meta-label border-b border-border px-3 py-2.5 whitespace-nowrap first:pl-4 last:pr-1"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="stagger">
            {reviews.map((review) => (
              <Row key={review.doctorId} review={review} decided={decided} />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="stagger space-y-3 lg:hidden">
        {reviews.map((review) => (
          <MobileRow key={review.doctorId} review={review} decided={decided} />
        ))}
      </ul>
    </>
  );
}

/// What the row's button offers, which follows from whether the application is
/// still open rather than from whether its paperwork happens to be complete.
function actionFor(review: DoctorReview, decided: boolean) {
  const isOpen =
    !decided &&
    (review.status === 'under_review' || review.status === 'changes_requested');
  const ready = isOpen && canApprove(review);

  return { isOpen, ready, label: ready ? 'Decide' : isOpen ? 'Review' : 'View' };
}

function Row({
  review,
  decided,
}: {
  readonly review: DoctorReview;
  readonly decided: boolean;
}) {
  const { isOpen, ready } = actionFor(review, decided);
  // Only an open application can be stale. Amber on a row nobody is waiting on
  // is an alarm with nothing behind it.
  const stale = isOpen && review.submittedAt ? isStale(review.submittedAt) : false;

  return (
    <tr className="group border-b border-divider-faint transition-colors duration-200 last:border-b-0 hover:bg-surface-muted">
      {/* The row is deliberately not one big link. Reviewers need to select and
          copy registration numbers, and the overlay that makes a whole row
          clickable swallows text selection. The name and the action button are
          the click targets instead. */}
      <td className="relative py-3 pr-3 pl-4">
        {/* A left edge on rows where every required document is already
            accepted. The one thing worth spotting from across the table: these
            need a decision, not a review. It grows in rather than appearing,
            so a row that becomes ready after a decision announces itself. */}
        <span
          aria-hidden="true"
          className={`absolute inset-y-1 left-0 w-[3px] origin-center rounded-full bg-success-strong transition-transform duration-500 ease-[var(--ease-spring)] ${
            ready ? 'scale-y-100' : 'scale-y-0'
          }`}
        />

        <Link
          href={`/queue/${review.doctorId}`}
          className="relative block font-semibold whitespace-nowrap text-text-primary transition-colors duration-200 group-hover:text-primary-deep group-hover:underline"
        >
          <LinkProgress />
          {review.fullName}
        </Link>
        <span className="text-xs text-text-tertiary">{review.phone ?? 'No phone'}</span>
      </td>

      <td className="px-3 py-3">
        <span className="text-card-body">{credentialsLabel(review)}</span>
      </td>

      <td className="tabular px-3 py-3 text-sm text-text-label">
        {review.registrationNumber ?? <span className="text-text-tertiary italic">Not given</span>}
      </td>

      <td className="px-3 py-3 text-sm text-text-label">{locationLabel(review)}</td>

      <td className="px-3 py-3">
        <DocumentPips review={review} />
        <span className="mt-1 block text-xs text-text-tertiary">{paperworkLabel(review)}</span>
      </td>

      <td className="px-3 py-3">
        {decided ? (
          <>
            <span className="tabular block text-sm font-semibold whitespace-nowrap text-text-label">
              {review.reviewedAt ? monthDayYear(review.reviewedAt) : '—'}
            </span>
            <span className="block max-w-[10rem] truncate text-xs text-text-tertiary">
              {review.reviewedByName ?? 'a reviewer'}
            </span>
          </>
        ) : (
          <>
            <span
              className={`tabular inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap ${
                stale ? 'text-warning' : 'text-text-label'
              }`}
            >
              {stale ? (
                <span
                  title="Waiting more than three days"
                  aria-label="Waiting more than three days"
                  className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning"
                />
              ) : null}
              {review.submittedAt ? waitingFor(review.submittedAt) : '—'}
            </span>
            <span className="block text-xs whitespace-nowrap text-text-tertiary">
              {review.submittedAt ? monthDayYear(review.submittedAt) : 'Not submitted'}
            </span>
          </>
        )}
      </td>

      <td className="px-3 py-3">
        <StatusBadge status={review.status} />
      </td>

      <td className="px-3 py-3 text-right last:pr-1">
        <ActionLink review={review} decided={decided} />
      </td>
    </tr>
  );
}

/// The same row, stacked. Everything the table column-aligns is still here; it
/// is grouped by what a reviewer reads together rather than spread across a
/// width the window does not have.
function MobileRow({
  review,
  decided,
}: {
  readonly review: DoctorReview;
  readonly decided: boolean;
}) {
  const { isOpen, ready } = actionFor(review, decided);
  const stale = isOpen && review.submittedAt ? isStale(review.submittedAt) : false;

  return (
    <li
      className={`lift relative overflow-hidden rounded-[var(--radius-card)] border bg-surface p-4 shadow-[var(--shadow-card)] ${
        ready ? 'border-success/30' : 'border-border'
      }`}
    >
      {ready ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-success-strong" />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/queue/${review.doctorId}`}
            className="relative block font-semibold text-text-primary hover:text-primary-deep hover:underline"
          >
            <LinkProgress />
            {review.fullName}
          </Link>
          <p className="text-helper mt-0.5 truncate">{credentialsLabel(review)}</p>
        </div>
        <StatusBadge status={review.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-meta-label">Registration</dt>
          <dd className="tabular truncate text-text-label">
            {review.registrationNumber ?? '—'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-meta-label">Practises in</dt>
          <dd className="truncate text-text-label">{locationLabel(review)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-meta-label">{decided ? 'Decided' : 'Waiting'}</dt>
          <dd className={`tabular font-semibold ${stale ? 'text-warning' : 'text-text-label'}`}>
            {decided
              ? review.reviewedAt
                ? monthDayYear(review.reviewedAt)
                : '—'
              : review.submittedAt
                ? waitingFor(review.submittedAt)
                : '—'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-meta-label">Documents</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            <DocumentPips review={review} />
            <span className="truncate text-xs text-text-tertiary">
              {paperworkLabel(review)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <ActionLink review={review} decided={decided} fullWidth />
      </div>
    </li>
  );
}

function ActionLink({
  review,
  decided,
  fullWidth = false,
}: {
  readonly review: DoctorReview;
  readonly decided: boolean;
  readonly fullWidth?: boolean;
}) {
  const { ready, label } = actionFor(review, decided);

  return (
    <Link
      href={`/queue/${review.doctorId}`}
      aria-label={`${label} ${review.fullName}`}
      // A ready application gets the filled treatment: it is the action the
      // reviewer came here to take, and it should not look like the others.
      className={`press group/action relative inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-3 text-[0.8125rem] font-semibold ${
        fullWidth ? 'w-full' : ''
      } ${
        ready
          ? 'bg-primary text-white shadow-[0_1px_2px_rgb(30_64_175/0.2)] hover:bg-primary-deep hover:shadow-[0_4px_12px_rgb(30_64_175/0.28)]'
          : 'border border-border bg-surface text-text-label group-hover:border-primary-soft group-hover:text-primary-deep'
      }`}
    >
      <LinkProgress />
      {label}
      <span
        aria-hidden="true"
        className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover/action:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

/// One line saying where the paperwork has got to. The wording is the reviewer's
/// next action, not a state name: "2 to check" is something to do, "partially
/// reviewed" is something to interpret.
function paperworkLabel(review: DoctorReview): string {
  const missing = missingDocuments(review).length;
  const outstanding = pendingDocuments(review).length;

  if (missing > 0) return `${missing} never uploaded`;
  if (outstanding > 0) return `${outstanding} to check`;
  return canApprove(review) ? 'all accepted' : 'see detail';
}

/// One pip per required document, so the state of a whole application reads at
/// a glance without opening it. Green accepted, red rejected, amber awaiting,
/// hollow never uploaded.
function DocumentPips({ review }: { readonly review: DoctorReview }) {
  return (
    <span className="flex items-center gap-1">
      {REQUIRED_DOCUMENTS.map((type) => {
        const document = documentOfType(review, type);
        const decision = document?.review.decision;

        const tone = !document
          ? 'border-2 border-dashed border-text-tertiary'
          : decision === 'accepted'
            ? 'bg-success-strong'
            : decision === 'rejected'
              ? 'bg-danger'
              : 'bg-warning';

        return (
          <span
            key={type}
            title={`${DOCUMENT_LABELS[type]}: ${document ? decision : 'not uploaded'}`}
            className={`size-2.5 rounded-full transition-transform duration-200 hover:scale-125 ${tone}`}
          />
        );
      })}
    </span>
  );
}
