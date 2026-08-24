import type { ActionResult } from '@/features/doctor-review/presentation/action-result';

/// The outcome of the last decision, shown next to the button that caused it.
///
/// This fills a real gap in the first pass: the server actions already returned
/// a `message` on success — "Document accepted.", "Registration approved." — and
/// nothing displayed it. A reviewer pressed a button, the page quietly
/// re-rendered, and the only evidence was a badge changing elsewhere on screen.
///
/// It started as a floating auto-dismissing toast, which turned out to be the
/// wrong shape twice over. Technically, a timed dismissal needs `setState`
/// inside an effect and a ref to re-trigger on a repeated message — both of
/// which React's rules of hooks reject, and rightly. And practically, a
/// confirmation that erases itself after four seconds is a poor fit for a tool
/// whose whole point is a durable record of who decided what.
///
/// So it renders straight from the action's state: no effect, no timer, no ref.
/// It persists until the next action replaces it, and sits where the reviewer is
/// already looking.
export function ResultBanner({ result }: { readonly result: ActionResult }) {
  if (result.ok && !result.message) return null;

  const isError = !result.ok;
  const text = result.ok ? result.message : result.error;

  return (
    <p
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`animate-rise-sm flex items-start gap-2 rounded-[var(--radius-control)] border px-3 py-2.5 text-[0.8125rem] font-medium ${
        isError
          ? 'border-danger/30 bg-danger-surface text-danger'
          : 'border-success/25 bg-success-surface text-success'
      }`}
    >
      <span className="animate-pop mt-px shrink-0" style={{ animationDelay: '90ms' }}>
        {isError ? <AlertIcon /> : <CheckIcon />}
      </span>
      <span>{text}</span>
    </p>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M13 4.5 6.5 11 3 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path d="M8 5v3.5m0 2.2v.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
