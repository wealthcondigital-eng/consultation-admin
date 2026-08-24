/// The form-level refusal, shown the same way on both sign-in tabs.
///
/// One component rather than the same twenty lines copied into each form —
/// they had already drifted once, and an error banner that looks different
/// depending on which tab you are on reads as two different failures.
export function AuthError({ message }: { readonly message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="animate-rise-sm flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-surface/80 px-3 py-2.5 text-[0.8125rem] font-medium text-danger"
    >
      <span aria-hidden="true" className="animate-pop mt-px shrink-0">
        <svg viewBox="0 0 16 16" className="size-4" fill="none">
          <path d="M8 5v3.5m0 2.2v.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <span>{message}</span>
    </p>
  );
}
