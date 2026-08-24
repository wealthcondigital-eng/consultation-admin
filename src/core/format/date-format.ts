/// Date and duration formatting, in one place so two screens cannot disagree
/// about what a timestamp looks like. Mirrors core/format/app_date_format.dart.

/// A fixed locale and time zone. Left to the browser, the same queue renders
/// differently for two reviewers, and "who saw what" matters in an audit.
const FORMAT_LOCALE = 'en-IN';
const FORMAT_ZONE = 'Asia/Kolkata';

export function monthDayYear(value: Date | string): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: FORMAT_ZONE,
  }).format(toDate(value));
}

export function dateAndTime(value: Date | string): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FORMAT_ZONE,
  }).format(toDate(value));
}

/// `3 days` — how long an applicant has been waiting.
///
/// This is the number that decides whether a queue is healthy, so it reads as a
/// duration rather than as a date the reviewer has to subtract in their head.
export function waitingFor(since: Date | string, now: Date = new Date()): string {
  const ms = now.getTime() - toDate(since).getTime();
  if (ms < 0) return 'just now';

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/// True once an application has been waiting long enough to be worth chasing.
/// Drives the amber row treatment in the queue.
export function isStale(since: Date | string, now: Date = new Date()): boolean {
  const days = (now.getTime() - toDate(since).getTime()) / 86_400_000;
  return days >= 3;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
