'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Spinner } from '@/core/widgets/button';

export type QueueView = 'all' | 'waiting' | 'returned' | 'ready';

export interface ViewCounts {
  readonly all: number;
  readonly waiting: number;
  readonly returned: number;
  readonly ready: number;
}

const VIEWS: ReadonlyArray<{ value: QueueView; label: string; short: string }> = [
  { value: 'all', label: 'Everything open', short: 'All' },
  { value: 'ready', label: 'Ready to approve', short: 'Ready' },
  { value: 'waiting', label: 'Still to check', short: 'To check' },
  { value: 'returned', label: 'Returned for changes', short: 'Returned' },
];

/// Search, filter and sort for the queue.
///
/// The first pass showed the whole queue with no way to narrow it, which is fine
/// at seven applications and unusable at three hundred. A reviewer chasing a
/// specific doctor — because the doctor rang, or because a registration number
/// came back from the council — needs to find one row, not scroll.
///
/// This pass adds the filter that actually shortens a working day: **ready to
/// approve**. Those rows need a decision rather than a review, they are the
/// cheapest work in the queue, and until now the only way to find them was to
/// open every application in turn.
///
/// State lives in the URL rather than in component state, so a filtered queue is
/// a link a reviewer can bookmark or paste to a colleague.
export function QueueFilters({
  total,
  shown,
  counts,
  view,
}: {
  readonly total: number;
  readonly shown: number;
  readonly counts: ViewCounts;
  readonly view: QueueView;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const sort = params.get('sort') === 'newest' ? 'newest' : 'oldest';

  // Debounced: pushing a route on every keystroke re-renders the table on the
  // server for input nobody has finished typing.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (query === current) return;

    const timer = setTimeout(() => {
      startTransition(() => router.replace(withParam('q', query || null), { scroll: false }));
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function withParam(key: string, value: string | null): string {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);

    const search = next.toString();
    return search ? `?${search}` : '?';
  }

  function go(key: string, value: string | null) {
    startTransition(() => router.replace(withParam(key, value), { scroll: false }));
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-tertiary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, registration no., city…"
            aria-label="Search the queue"
            className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface pr-10 pl-9 text-sm text-text-primary transition-[border-color,box-shadow] duration-200 placeholder:text-text-tertiary hover:border-text-tertiary/60 focus:ring-4 focus:ring-primary-soft/15"
          />

          <span className="absolute top-1/2 right-3 -translate-y-1/2">
            {isPending ? (
              <span className="text-primary-vivid">
                <Spinner />
              </span>
            ) : query ? (
              // Clearing a search by selecting the text and deleting it is
              // three actions; this is one, and it is the action most often
              // wanted right after a search finds the wrong doctor.
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear the search"
                className="animate-scale-in grid size-5 cursor-pointer place-items-center rounded-full bg-divider-faint text-text-secondary transition-colors duration-200 hover:bg-border hover:text-text-primary"
              >
                <CloseIcon />
              </button>
            ) : null}
          </span>
        </div>

        <SortToggle sort={sort} onChange={(value) => go('sort', value === 'oldest' ? null : value)} />

        <p className="text-helper ml-auto shrink-0 tabular">
          {shown === total ? `${total} open` : `${shown} of ${total}`}
        </p>
      </div>

      {/* The filter row. Counts sit inside the chips because a filter that
          leads to an empty table is a filter nobody should have been offered. */}
      <div
        role="group"
        aria-label="Filter the queue"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {VIEWS.map((option) => {
          const active = option.value === view;
          const count = counts[option.value];

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              title={option.label}
              disabled={count === 0 && !active}
              onClick={() => go('view', option.value === 'all' ? null : option.value)}
              className={`press flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[0.8125rem] font-semibold ${
                active
                  ? 'border-primary-soft bg-primary-surface text-primary-deep shadow-[0_1px_6px_rgb(37_99_235/0.14)]'
                  : count === 0
                    ? 'cursor-not-allowed border-border bg-surface text-text-tertiary opacity-60'
                    : 'cursor-pointer border-border bg-surface text-text-secondary hover:border-primary-soft/50 hover:bg-surface-muted hover:text-text-label'
              }`}
            >
              {option.short}
              <span
                className={`tabular rounded-full px-1.5 py-px text-xs font-bold transition-colors duration-200 ${
                  active ? 'bg-primary-vivid text-white' : 'bg-divider-faint text-text-secondary'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/// Two options, one moving thumb. The thumb slides between them rather than the
/// highlight jumping, which is the difference between a control that looks like
/// a switch and one that looks like two buttons that happen to touch.
///
/// This took three passes to get right, and the reasons are worth keeping:
///
///  1. It was **six pixels shorter** than the 44px search field beside it, so
///     the row carried two controls on different baselines.
///  2. Fixing that, the track was given the muted grey — which is `#f8fafc`,
///     all but identical to the `#f6f8fc` canvas it sits on. The track
///     disappeared into the page and left a white thumb apparently floating
///     inside a stray outline. Worse, the thumb's own ring sat directly on the
///     track's border, drawing two lines a pixel apart.
///
/// So the rule now is: **the track takes the colour of the control beside it,
/// and the thumb takes the tint of the chips below it.** White with a border,
/// exactly like the search input; a `primarySurface` thumb, exactly like an
/// active filter chip. The row then reads as one family of controls instead of
/// three unrelated ones, and the thumb is visible because it is tinted rather
/// than because it is outlined.
function SortToggle({
  sort,
  onChange,
}: {
  readonly sort: 'oldest' | 'newest';
  readonly onChange: (value: 'oldest' | 'newest') => void;
}) {
  const OPTIONS = [
    ['oldest', 'Longest waiting'],
    ['newest', 'Newest first'],
  ] as const;

  return (
    <div
      role="group"
      aria-label="Sort order"
      className="relative flex h-11 shrink-0 items-stretch rounded-[var(--radius-control)] border border-border bg-surface p-1"
    >
      {/* Inset by the same 0.25rem of padding on every side, so translating it
          by its own width lands it exactly on the second segment. The radius is
          the outer one minus that padding, which is what keeps the two curves
          concentric instead of merely both-rounded. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[calc(var(--radius-control)-0.25rem)] bg-primary-surface transition-transform duration-300 ease-[var(--ease-out-quint)]"
        style={{ transform: sort === 'newest' ? 'translateX(100%)' : 'translateX(0)' }}
      />

      {OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={sort === value}
          onClick={() => onChange(value)}
          className={`relative z-10 flex-1 cursor-pointer rounded-[calc(var(--radius-control)-0.25rem)] px-4 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-200 ${
            sort === value
              ? 'text-primary-deep'
              : 'text-text-secondary hover:text-text-label'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
