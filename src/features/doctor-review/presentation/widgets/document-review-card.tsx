'use client';

import { useActionState, useState, useTransition } from 'react';

import { dateAndTime } from '@/core/format/date-format';
import { AppButton, Spinner } from '@/core/widgets/button';
import { DecisionBadge } from '@/core/widgets/badge';
import { TextArea } from '@/core/widgets/field';
import { ResultBanner } from '@/core/widgets/result-banner';
import {
  DOCUMENT_LABELS,
  MIN_REASON_LENGTH,
  isViewableInline,
  sizeLabel,
  type DoctorDocument,
} from '@/features/doctor-review/domain/entities/doctor-review';

import { decideDocumentAction, documentUrlAction } from '../actions';
import { idleResult } from '../action-result';

/// One uploaded file, with its own accept/reject.
///
/// The document and the decision live in the same card on purpose. Splitting
/// them — a list here, a viewer elsewhere, buttons in a third place — is what
/// produces a reviewer who accepts a certificate they never opened.
///
/// The viewer opens by animating the row from `0fr` to `1fr` rather than
/// appearing. On a card that suddenly grows by six hundred pixels, the slide is
/// what keeps the rest of the page from feeling like it jumped — the reviewer
/// can see where the content below went instead of having to find it again.
export function DocumentReviewCard({
  doctorId,
  document,
  isDecidable,
}: {
  readonly doctorId: string;
  readonly document: DoctorDocument;
  /// False once the application has an outcome. The history stays readable; the
  /// controls go away, because re-deciding a closed application is a different
  /// action from deciding an open one.
  readonly isDecidable: boolean;
}) {
  const [state, action, isPending] = useActionState(decideDocumentAction, idleResult);
  const [note, setNote] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [isLoadingUrl, startLoadingUrl] = useTransition();

  /// Whether the reviewer has actually opened this file in this session.
  ///
  /// Not a gate — someone may have read it yesterday, and blocking them would
  /// only teach them to click through. But accepting a certificate sight-unseen
  /// is the failure this whole screen exists to prevent, so it is worth saying
  /// out loud at the moment of the decision.
  const [hasOpened, setHasOpened] = useState(false);

  const decision = document.review.decision;
  const noteIsTooShort = note.trim().length < MIN_REASON_LENGTH;

  function toggleViewer() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setHasOpened(true);
    if (url) return;

    // Minted per open rather than cached with the card: the link is valid for
    // minutes, so a stale one in component state would fail silently later.
    startLoadingUrl(async () => {
      const result = await documentUrlAction(doctorId, document.id);
      if ('url' in result) {
        setUrl(result.url);
        setViewerError(null);
      } else {
        setViewerError(result.error);
      }
    });
  }

  return (
    <li
      className={`overflow-hidden rounded-[var(--radius-card)] border bg-surface transition-[border-color,box-shadow] duration-300 ${
        decision === 'accepted'
          ? 'border-success/30'
          : decision === 'rejected'
            ? 'border-danger/30'
            : 'border-border'
      } ${isOpen ? 'shadow-[var(--shadow-card)]' : ''}`}
    >
      {/* A hairline down the left edge in the colour of the decision. It is the
          only way to read a column of eight cards and see which ones are still
          outstanding without reading eight badges. */}
      <div className="relative">
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1 transition-colors duration-300 ${
            decision === 'accepted'
              ? 'bg-success-strong'
              : decision === 'rejected'
                ? 'bg-danger'
                : 'bg-warning/60'
          }`}
        />

        <div className="flex flex-wrap items-start gap-3 p-4 pl-5">
          <FileGlyph mimeType={document.mimeType} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-card-title">{DOCUMENT_LABELS[document.type]}</h3>
              <DecisionBadge decision={decision} />
              {hasOpened ? (
                <span
                  className="animate-pop inline-flex items-center gap-1 rounded-full bg-surface-muted px-1.5 py-0.5 text-[0.6875rem] font-semibold text-text-secondary"
                  title="You have opened this file in this session"
                >
                  <EyeIcon />
                  opened
                </span>
              ) : null}
            </div>

            <p className="text-helper mt-0.5 truncate" title={document.fileName}>
              {document.fileName} · {sizeLabel(document.sizeBytes)} ·{' '}
              {document.source === 'scan' ? 'scanned in app' : 'uploaded from device'}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              Uploaded {dateAndTime(document.uploadedAt)}
            </p>
          </div>

          <AppButton
            label={isOpen ? 'Hide document' : 'View document'}
            variant={isOpen ? 'outline' : 'primary'}
            size="sm"
            onClick={toggleViewer}
            aria-expanded={isOpen}
            icon={<Chevron open={isOpen} />}
          />
        </div>
      </div>

      {/* The decision already on record. Shown whether or not the application
          is still open, because a note explaining a past rejection is the most
          useful thing on the card when a re-upload arrives. */}
      {decision !== 'pending' && document.review.note ? (
        <p
          className={`mx-4 mb-4 rounded-[var(--radius-control)] px-3 py-2.5 text-[0.8125rem] ${
            decision === 'rejected'
              ? 'bg-danger-surface text-danger'
              : 'bg-surface-muted text-text-label'
          }`}
        >
          <span className="font-semibold">
            {document.review.reviewedByName ?? 'A reviewer'}
          </span>
          {document.review.reviewedAt ? ` · ${dateAndTime(document.review.reviewedAt)}` : ''}
          <br />
          {document.review.note}
        </p>
      ) : null}

      {/* Kept mounted once opened, so closing it animates shut rather than
          vanishing — and so re-opening does not re-request the signed link. */}
      <div className="collapsible" data-open={isOpen}>
        <div>
          <div className="border-t border-divider-faint bg-surface-muted p-4">
            {isLoadingUrl ? (
              <div className="flex h-24 items-center justify-center gap-2 text-text-secondary">
                <Spinner />
                <span className="text-sm">Requesting a secure link…</span>
              </div>
            ) : viewerError ? (
              <p className="rounded-[var(--radius-control)] border border-danger/30 bg-danger-surface px-3 py-2.5 text-[0.8125rem] text-danger">
                {viewerError}
              </p>
            ) : url ? (
              <Viewer url={url} document={document} />
            ) : null}
          </div>
        </div>
      </div>

      {isDecidable ? (
        <form action={action} className="border-t border-divider-faint p-4">
          <input type="hidden" name="doctorId" value={doctorId} />
          <input type="hidden" name="documentId" value={document.id} />

          <TextArea
            label="Note"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            minLength={MIN_REASON_LENGTH}
            placeholder="e.g. The registration number matches the state council register."
            helper={
              noteIsTooShort
                ? 'Optional when accepting. Required to reject.'
                : 'The doctor sees this if you reject.'
            }
          />

          <div className="mb-3 empty:hidden">
            <ResultBanner result={state} />
          </div>

          {decision === 'pending' && !hasOpened ? (
            <p className="animate-rise-sm mb-3 flex items-start gap-2 rounded-[var(--radius-control)] border border-warning/25 bg-warning-surface px-3 py-2.5 text-[0.8125rem] text-warning">
              <span aria-hidden="true" className="animate-nudge-x mt-px shrink-0 font-bold">
                !
              </span>
              <span>
                You have not opened this document yet. Accepting it is a
                statement that you have read it.
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <AppButton
              label={decision === 'accepted' ? 'Accepted' : 'Accept document'}
              name="intent"
              value="accept"
              type="submit"
              variant="success"
              size="sm"
              isLoading={isPending}
              disabled={decision === 'accepted'}
              icon={decision === 'accepted' ? <TickIcon /> : undefined}
            />
            <AppButton
              label="Reject document"
              name="intent"
              value="reject"
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isPending}
              // A rejection with no note sends the doctor back to the same
              // upload with the same problem.
              disabled={noteIsTooShort}
              title={
                noteIsTooShort
                  ? `Say what is wrong with it — at least ${MIN_REASON_LENGTH} characters.`
                  : undefined
              }
            />
          </div>
        </form>
      ) : null}
    </li>
  );
}

function Viewer({
  url,
  document,
}: {
  readonly url: string;
  readonly document: DoctorDocument;
}) {
  if (!isViewableInline(document)) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-card-subtitle">
          This file type cannot be shown here.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm font-semibold text-primary-vivid hover:underline"
        >
          Open in a new tab
        </a>
      </div>
    );
  }

  if (document.mimeType.startsWith('image/')) {
    return (
      <div className="animate-fade space-y-2">
        {/* Not next/image: the source is a short-lived signed URL on a host the
            optimiser must not be pointed at, and these are one-off documents
            with nothing to cache. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${DOCUMENT_LABELS[document.type]} uploaded by the applicant`}
          className="max-h-[36rem] w-full rounded-[var(--radius-control)] border border-border bg-white object-contain shadow-[var(--shadow-card)]"
        />
        <ViewerFooter url={url} />
      </div>
    );
  }

  return (
    <div className="animate-fade space-y-2">
      <iframe
        src={url}
        title={`${DOCUMENT_LABELS[document.type]} — ${document.fileName}`}
        className="h-[36rem] w-full rounded-[var(--radius-control)] border border-border bg-white shadow-[var(--shadow-card)]"
      />
      <ViewerFooter url={url} />
    </div>
  );
}

function ViewerFooter({ url }: { readonly url: string }) {
  return (
    <p className="text-xs text-text-tertiary">
      This link expires shortly.{' '}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="font-semibold text-primary-vivid hover:underline"
      >
        Open full size
      </a>
    </p>
  );
}

function FileGlyph({ mimeType }: { readonly mimeType: string }) {
  const isPdf = mimeType === 'application/pdf';

  return (
    <span
      aria-hidden="true"
      className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-xs font-bold transition-transform duration-300 ease-[var(--ease-spring)] ${
        isPdf ? 'bg-danger-surface text-danger' : 'bg-primary-surface text-primary-deep'
      }`}
    >
      {isPdf ? 'PDF' : 'IMG'}
    </span>
  );
}

/// Rotates rather than swapping between two glyphs, so the control reads as one
/// thing changing state and not as two different buttons.
function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 transition-transform duration-300 ease-[var(--ease-spring)] ${
        open ? 'rotate-180' : ''
      }`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.9"
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
      <path
        d="M1.5 8S4 3.8 8 3.8 14.5 8 14.5 8 12 12.2 8 12.2 1.5 8 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
