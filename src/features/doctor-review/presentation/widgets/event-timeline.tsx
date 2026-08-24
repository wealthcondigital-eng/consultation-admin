import Link from 'next/link';

import { dateAndTime, monthDayYear } from '@/core/format/date-format';
import {
  ACTION_LABELS,
  actionTone,
  type VerificationAction,
  type VerificationEvent,
} from '@/features/doctor-review/domain/entities/verification-event';
import { DOCUMENT_LABELS } from '@/features/doctor-review/domain/entities/doctor-review';

/// The audit trail for one application, or for the whole console.
///
/// Append-only, and it says so. This is medical credentialing: the question
/// "who approved this doctor, when, and on the strength of which documents" has
/// to be answerable months later, and a mutable `reviewed_by` field answers
/// only the most recent third of it.
///
/// Two changes over the first pass, both aimed at the full-trail view, where
/// the list runs to hundreds of rows:
///
///  * each entry carries a **glyph for its action** rather than a coloured dot.
///    Three tones cannot distinguish "document accepted" from "application
///    approved", and on an audit screen that is exactly the distinction being
///    looked for.
///  * entries are **grouped by day**, with the date pinned as the list scrolls.
///    "Who approved this on the 14th" is how the question is always asked.
export function EventTimeline({
  events,
  showDoctor = false,
  grouped = false,
}: {
  readonly events: readonly VerificationEvent[];
  readonly showDoctor?: boolean;
  readonly grouped?: boolean;
}) {
  if (events.length === 0) {
    return <p className="text-card-subtitle py-4">Nothing recorded yet.</p>;
  }

  if (!grouped) {
    return <Entries events={events} showDoctor={showDoctor} />;
  }

  return (
    <div className="space-y-6">
      {groupByDay(events).map(([day, dayEvents]) => (
        <section key={day}>
          <h3 className="text-meta-label sticky top-0 z-10 -mx-1 mb-3 bg-surface/95 px-1 py-1.5 backdrop-blur">
            {day}
            <span className="ml-2 font-normal normal-case">
              · {dayEvents.length} entr{dayEvents.length === 1 ? 'y' : 'ies'}
            </span>
          </h3>
          <Entries events={dayEvents} showDoctor={showDoctor} />
        </section>
      ))}
    </div>
  );
}

function Entries({
  events,
  showDoctor,
}: {
  readonly events: readonly VerificationEvent[];
  readonly showDoctor: boolean;
}) {
  return (
    <ol className="stagger relative space-y-4 pl-8">
      {/* The rail. Drawn once behind the glyphs rather than per row, so it does
          not break between items, and faded at the bottom so the list does not
          end on a hard stop that reads like a cut-off. */}
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[0.6875rem] w-px bg-gradient-to-b from-border via-border to-transparent"
      />

      {events.map((event) => {
        const tone = actionTone(event.action);

        return (
          <li key={event.id} className="relative">
            <span
              aria-hidden="true"
              className={`absolute top-0.5 -left-8 grid size-6 place-items-center rounded-full ring-4 ring-surface ${
                tone === 'positive'
                  ? 'bg-badge-surface text-success'
                  : tone === 'negative'
                    ? 'bg-danger-surface text-danger'
                    : 'bg-surface-muted text-text-secondary'
              }`}
            >
              <ActionGlyph action={event.action} />
            </span>

            <p className="text-sm font-semibold text-text-primary">
              {ACTION_LABELS[event.action]}
              {event.documentType ? (
                <span className="font-normal text-text-secondary">
                  {' '}
                  — {DOCUMENT_LABELS[event.documentType].toLowerCase()}
                </span>
              ) : null}
            </p>

            <p className="mt-0.5 text-xs text-text-tertiary">
              {showDoctor ? (
                <>
                  <Link
                    href={`/queue/${event.doctorId}`}
                    className="font-semibold text-text-secondary transition-colors duration-200 hover:text-primary-deep hover:underline"
                  >
                    {event.doctorName}
                  </Link>
                  {' · '}
                </>
              ) : null}
              {event.actorName ?? 'the applicant'} · {dateAndTime(event.at)}
            </p>

            {event.note ? (
              <p className="text-card-body mt-1.5 rounded-[var(--radius-chip)] border-l-2 border-border bg-surface-muted px-2.5 py-2 transition-colors duration-200 hover:border-primary-soft">
                {event.note}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/// Newest first is preserved: the events arrive in that order and `Map` keeps
/// insertion order, so the first group is the most recent day.
function groupByDay(
  events: readonly VerificationEvent[],
): Array<[string, VerificationEvent[]]> {
  const days = new Map<string, VerificationEvent[]>();

  for (const event of events) {
    const day = monthDayYear(event.at);
    const bucket = days.get(day);
    if (bucket) bucket.push(event);
    else days.set(day, [event]);
  }

  return [...days.entries()];
}

function ActionGlyph({ action }: { readonly action: VerificationAction }) {
  switch (action) {
    case 'approved':
    case 'document_accepted':
      return (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
          <path
            d="M13 4.5 6.5 11 3 7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rejected':
    case 'document_rejected':
      return (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
          <path
            d="M4.5 4.5l7 7M11.5 4.5l-7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'changes_requested':
      return (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
          <path
            d="M6 3 2.8 6.2 6 9.4M3 6.2h6a4 4 0 0 1 0 8H5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'reopened':
      return (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
          <path
            d="M13 8a5 5 0 1 1-1.6-3.7M13 2v3h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
          <path
            d="M8 12.5V3.5M4.5 7 8 3.5 11.5 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
