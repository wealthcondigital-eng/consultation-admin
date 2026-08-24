import Link from 'next/link';

import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { Card } from '@/core/widgets/card';
import { EmptyState } from '@/core/widgets/empty-state';
import { LinkProgress } from '@/core/widgets/link-progress';
import { PageHeader } from '@/core/widgets/page-header';
import { QueueTable } from '@/features/doctor-review/presentation/widgets/queue-table';
import type { ApplicationStatus } from '@/features/doctor-review/domain/entities/doctor-review';

export const dynamic = 'force-dynamic';

interface Tab {
  readonly status: ApplicationStatus;
  readonly label: string;
  readonly blurb: string;
  readonly tone: 'positive' | 'negative' | 'caution';
}

/// The tab a bare `/decided` opens on. Named rather than reached as `TABS[0]`
/// so the fallback is a value the compiler can see is always there.
const DEFAULT_TAB: Tab = {
  status: 'approved',
  label: 'Approved',
  blurb: 'Cleared to take consultations.',
  tone: 'positive',
};

const TABS: readonly Tab[] = [
  DEFAULT_TAB,
  {
    status: 'rejected',
    label: 'Rejected',
    blurb: 'Closed. The doctor has to apply again.',
    tone: 'negative',
  },
  {
    status: 'changes_requested',
    label: 'Returned for changes',
    blurb: 'Still open — waiting on the doctor to re-upload.',
    tone: 'caution',
  },
];

const TAB_TONES = {
  positive: 'border-success/40 bg-success-surface text-success',
  negative: 'border-danger/40 bg-danger-surface text-danger',
  caution: 'border-warning/40 bg-warning-surface text-warning',
} as const;

/// Applications that already have an outcome.
///
/// Kept off the queue on purpose: a decided application in the working list is
/// noise, and a reviewer looking for one is looking deliberately.
export default async function DecidedPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ status?: string }>;
}) {
  const { status: requested } = await searchParams;

  const active = TABS.find((tab) => tab.status === requested) ?? DEFAULT_TAB;

  let reviews;
  try {
    const { repository } = await reviewGraph();
    reviews = await repository.fetchQueue(active.status);
  } catch (error) {
    return (
      <Card>
        <EmptyState tone="error" title="Could not load" message={messageFor(error)} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Decided"
        title={
          reviews.length === 0
            ? active.label
            : `${reviews.length} ${active.label.toLowerCase()}`
        }
        subtitle={`${active.blurb} Read-only here — reopening an application is an action on the application itself, recorded in the audit trail like any other.`}
      >
        {/* The active tab is tinted in the colour of the outcome it holds, so a
            reviewer who lands here from a link knows which pile they are
            looking at before reading a single row. */}
        <nav aria-label="Outcome" className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = tab.status === active.status;

            return (
              <Link
                key={tab.status}
                href={`/decided?status=${tab.status}`}
                aria-current={isActive ? 'page' : undefined}
                className={`press relative rounded-[var(--radius-control)] border px-3.5 py-2 text-sm font-semibold ${
                  isActive
                    ? `${TAB_TONES[tab.tone]} shadow-[var(--shadow-card)]`
                    : 'border-border bg-surface text-text-secondary hover:border-text-tertiary/50 hover:bg-surface-muted hover:text-text-label'
                }`}
              >
                <LinkProgress />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </PageHeader>

      {reviews.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing here yet"
            message="No applications carry this outcome."
          />
        </Card>
      ) : (
        <div className="lg:rounded-[var(--radius-card)] lg:border lg:border-border lg:bg-surface lg:px-4 lg:py-3 lg:shadow-[var(--shadow-card)]">
          {/* `decided` for everything on this screen — including the returned
              pile, which is open in the sense that the doctor can still act on
              it but is not open to a decision *here* until they do. */}
          <QueueTable reviews={reviews} decided />
        </div>
      )}
    </>
  );
}
