'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { dateAndTime } from '@/core/format/date-format';
import { AppButton } from '@/core/widgets/button';
import { TextArea } from '@/core/widgets/field';
import { LinkProgress } from '@/core/widgets/link-progress';
import { ResultBanner } from '@/core/widgets/result-banner';
import {
  MIN_REASON_LENGTH,
  REQUIRED_DOCUMENTS,
  approvalBlockers,
  documentOfType,
  type DoctorReview,
} from '@/features/doctor-review/domain/entities/doctor-review';

import { decideApplicationAction } from '../actions';
import { idleResult } from '../action-result';

/// The three ways a registration can leave the queue.
///
/// The panel's job is to make approval unavailable until it is earned.
/// `approvalBlockers` is the same function the API check runs, and the blockers
/// are listed as sentences rather than hidden behind a disabled button — a
/// reviewer who cannot tell why they cannot approve will go looking for a way
/// around it.
///
/// Approving is a **two-step** action. Everything else here is recoverable: a
/// returned application comes back, a rejected one can be re-applied for. An
/// approval puts a doctor in front of patients, and that should not be one
/// stray click on a button the reviewer's cursor happened to be resting on.
///
/// New in this pass: a meter across the top counting accepted documents against
/// required ones. The blockers already said what was missing, but as a list of
/// sentences it took reading; "2 of 3 accepted" is the same fact at a glance,
/// and it fills in as the reviewer works down the documents beside it.
export function DecisionPanel({
  review,
  nextHref,
}: {
  readonly review: DoctorReview;
  /// The next application still waiting, if there is one. Offered after a
  /// decision so a reviewer working through the queue does not have to go back
  /// to the list and find their place again.
  readonly nextHref?: string | null;
}) {
  const [state, action, isPending] = useActionState(decideApplicationAction, idleResult);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  const blockers = approvalBlockers(review);
  const isOpen = review.status === 'under_review' || review.status === 'changes_requested';
  const reasonIsTooShort = reason.trim().length < MIN_REASON_LENGTH;

  const accepted = REQUIRED_DOCUMENTS.filter(
    (type) => documentOfType(review, type)?.review.decision === 'accepted',
  ).length;

  if (!isOpen) {
    const wasApproved = review.status === 'approved';

    return (
      <div className="space-y-3">
        <ResultBanner result={state} />

        <div
          className={`animate-scale-in flex items-start gap-3 rounded-[var(--radius-control)] px-4 py-3.5 ${
            wasApproved
              ? 'bg-badge-surface text-success'
              : 'bg-danger-surface text-danger'
          }`}
        >
          <span
            aria-hidden="true"
            className="animate-pop mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-current/10"
            style={{ animationDelay: '120ms' }}
          >
            {wasApproved ? <TickIcon /> : <CrossIcon />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">
              {wasApproved ? 'Approved' : 'Rejected'}
            </span>
            <span className="mt-0.5 block text-[0.8125rem]">
              by {review.reviewedByName ?? 'a reviewer'}
              {review.reviewedAt ? ` on ${dateAndTime(review.reviewedAt)}` : ''}
            </span>
          </span>
        </div>

        {review.rejectionReason ? (
          <div>
            <p className="text-meta-label mb-1">Reason given to the doctor</p>
            <p className="text-card-body rounded-[var(--radius-chip)] bg-surface-muted px-3 py-2">
              {review.rejectionReason}
            </p>
          </div>
        ) : null}

        {nextHref ? (
          <Link
            href={nextHref}
            className="press group relative flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgb(30_64_175/0.2)] hover:bg-primary-deep hover:shadow-[0_4px_14px_rgb(30_64_175/0.3)]"
          >
            <LinkProgress />
            Next application
            <span className="transition-transform duration-300 ease-[var(--ease-spring)] group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        ) : null}

        <p className="text-helper">
          Decided applications are read-only here. Reopening one is a separate
          action, recorded in the audit trail like any other.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="doctorId" value={review.doctorId} />

      <ResultBanner result={state} />

      {/* The meter, then the words. Somebody who has been in this screen for an
          hour reads only the meter; somebody who has just arrived needs the
          sentence under it. */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-meta-label">Required documents</span>
          <span
            className={`tabular text-xs font-bold ${
              accepted === REQUIRED_DOCUMENTS.length ? 'text-success' : 'text-text-secondary'
            }`}
          >
            {accepted}/{REQUIRED_DOCUMENTS.length} accepted
          </span>
        </div>
        <div className="flex gap-1">
          {REQUIRED_DOCUMENTS.map((type, index) => {
            const decision = documentOfType(review, type)?.review.decision;

            return (
              <span
                key={type}
                className={`animate-grow-x h-1.5 flex-1 origin-left rounded-full ${
                  decision === 'accepted'
                    ? 'bg-success-strong'
                    : decision === 'rejected'
                      ? 'bg-danger'
                      : decision
                        ? 'bg-warning'
                        : 'bg-divider-faint'
                }`}
                style={{ animationDelay: `${120 + index * 90}ms` }}
              />
            );
          })}
        </div>
      </div>

      {blockers.length > 0 ? (
        <div className="animate-rise-sm rounded-[var(--radius-control)] border border-warning/30 bg-warning-surface px-3.5 py-3">
          <p className="text-[0.8125rem] font-bold text-warning">Cannot approve yet</p>
          <ul className="mt-1.5 space-y-1">
            {blockers.map((blocker) => (
              <li key={blocker} className="flex gap-2 text-[0.8125rem] text-warning">
                <span aria-hidden="true">·</span>
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="animate-rise-sm flex items-start gap-2 rounded-[var(--radius-control)] border border-success/25 bg-success-surface px-3.5 py-3">
          <span className="mt-px shrink-0 text-success">
            <TickIcon />
          </span>
          <p className="text-[0.8125rem] font-semibold text-success">
            Every required document has been accepted. This registration is
            ready to approve.
          </p>
        </div>
      )}

      {/* --- Approve: armed, then confirmed --------------------------- */}
      {confirming ? (
        <div className="animate-scale-in space-y-2.5 rounded-[var(--radius-control)] border border-primary-soft bg-primary-surface p-3.5 shadow-[0_4px_16px_rgb(37_99_235/0.12)]">
          <p className="text-sm font-bold text-primary-deep">
            Approve {review.fullName}?
          </p>
          <p className="text-[0.8125rem] text-primary-deep/85">
            They will be able to take consultations with patients. This is
            recorded against your name.
          </p>
          <div className="flex gap-2 pt-1">
            <AppButton
              label="Yes, approve"
              name="intent"
              value="approve"
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPending}
            />
            <AppButton
              label="Cancel"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            />
          </div>
        </div>
      ) : (
        <AppButton
          label="Approve registration"
          type="button"
          variant="primary"
          fullWidth
          disabled={blockers.length > 0}
          title={blockers[0]}
          onClick={() => setConfirming(true)}
        />
      )}

      <div className="border-t border-divider-faint pt-4">
        <TextArea
          label="Reason"
          name="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          minLength={MIN_REASON_LENGTH}
          placeholder="e.g. The certificate is not legible — please re-upload it."
          helper="Required to return or reject. The doctor sees this, so say what they need to fix."
        />

        <div className="space-y-2.5">
          <AppButton
            label="Return for changes"
            name="intent"
            value="request_changes"
            type="submit"
            variant="outline"
            fullWidth
            isLoading={isPending}
            disabled={reasonIsTooShort}
            title={reasonIsTooShort ? 'Give a reason first.' : undefined}
          />

          <AppButton
            label="Reject registration"
            name="intent"
            value="reject"
            type="submit"
            variant="danger"
            fullWidth
            isLoading={isPending}
            disabled={reasonIsTooShort}
            title={reasonIsTooShort ? 'Give a reason first.' : undefined}
          />
        </div>
      </div>

      <p className="text-helper">
        Returning keeps the application open so the doctor can replace a single
        document. Rejecting closes it and they have to apply again.
      </p>
    </form>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M13 4.5 6.5 11 3 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
