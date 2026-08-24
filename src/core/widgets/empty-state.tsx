import type { ReactNode } from 'react';

/// The empty and error states from `_EmptyQueue` in admin_queue_screen.dart.
///
/// One component for both, because they occupy the same slot and the difference
/// is a tone — an empty queue is good news and should not be dressed as a
/// fault.
///
/// The glyph arrives with a spring and sits inside a soft halo. An empty screen
/// is the one place in a console where a moment of polish costs nothing: there
/// is no data for it to compete with, and the alternative is a blank rectangle
/// that reads as a page that failed to load.
export function EmptyState({
  title,
  message,
  tone = 'empty',
  action,
}: {
  readonly title: string;
  readonly message: string;
  readonly tone?: 'empty' | 'error';
  readonly action?: ReactNode;
}) {
  const isError = tone === 'error';

  return (
    <div className="animate-fade flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-5">
        <span
          aria-hidden="true"
          className={`absolute inset-0 -m-3 animate-pulse rounded-full blur-xl ${
            isError ? 'bg-danger/15' : 'bg-success/15'
          }`}
        />
        <div
          className={`animate-scale-in relative grid size-16 place-items-center rounded-full ${
            isError ? 'bg-danger-surface text-danger' : 'bg-badge-surface text-success'
          }`}
        >
          {isError ? <AlertIcon /> : <InboxIcon />}
        </div>
      </div>

      <h3
        className="animate-rise-sm text-card-title text-text-primary"
        style={{ animationDelay: '90ms' }}
      >
        {title}
      </h3>
      <p
        className="animate-rise-sm text-card-subtitle mt-1.5 max-w-sm leading-relaxed"
        style={{ animationDelay: '150ms' }}
      >
        {message}
      </p>
      {action ? (
        <div className="animate-rise-sm mt-5" style={{ animationDelay: '210ms' }}>
          {action}
        </div>
      ) : null}
    </div>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden="true">
      <path
        d="M3 13h4l1.5 3h7L17 13h4M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden="true">
      <path
        d="M12 8v5m0 3.5v.5M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
