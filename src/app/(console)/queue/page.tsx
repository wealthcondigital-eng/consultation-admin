import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { Card } from '@/core/widgets/card';
import { EmptyState } from '@/core/widgets/empty-state';
import { HeaderStat, PageHeader } from '@/core/widgets/page-header';
import {
  canApprove,
  locationLabel,
  type DoctorReview,
} from '@/features/doctor-review/domain/entities/doctor-review';
import {
  QueueFilters,
  type QueueView,
} from '@/features/doctor-review/presentation/widgets/queue-filters';
import { QueueTable } from '@/features/doctor-review/presentation/widgets/queue-table';

export const dynamic = 'force-dynamic';

const VIEWS: readonly QueueView[] = ['all', 'waiting', 'returned', 'ready'];

/// The review queue: registrations waiting on a decision.
///
/// The successor to `AdminQueueScreen`, rendered as a table because this surface
/// is for comparing rows rather than reading one at a time. Search, filter and
/// sort are read from the URL so a narrowed queue is a shareable link.
export default async function QueuePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ q?: string; sort?: string; view?: string }>;
}) {
  const { q, sort, view: requestedView } = await searchParams;

  let reviews: DoctorReview[];
  try {
    const { repository } = await reviewGraph();
    reviews = await repository.fetchQueue();
  } catch (error) {
    return (
      <Card>
        <EmptyState
          tone="error"
          title="The queue could not be loaded"
          message={messageFor(error)}
        />
      </Card>
    );
  }

  const view: QueueView = VIEWS.includes(requestedView as QueueView)
    ? (requestedView as QueueView)
    : 'all';
  const query = (q ?? '').trim().toLowerCase();

  // Filtered here rather than in the API. The open queue is bounded — hundreds,
  // not millions — so one round trip and a local filter beats a query parameter
  // per field. It moves server-side the day this list needs pagination.
  const matched = query
    ? reviews.filter((review) =>
        [
          review.fullName,
          review.registrationNumber ?? '',
          review.specialty ?? '',
          locationLabel(review),
          review.phone ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : reviews;

  // Counts are taken *after* the search so the chips describe what is actually
  // reachable from here. A chip reading "4 ready" that leads to an empty table
  // because the search excluded all four is worse than no chip at all.
  const counts = {
    all: matched.length,
    ready: matched.filter(canApprove).length,
    waiting: matched.filter((review) => review.status === 'under_review' && !canApprove(review))
      .length,
    returned: matched.filter((review) => review.status === 'changes_requested').length,
  };

  const filtered = matched.filter((review) => inView(review, view));

  // The API returns oldest first, which is the order that matters. `newest` is
  // opt-in for the reviewer who wants to see what just arrived.
  const ordered =
    sort === 'newest'
      ? [...filtered].sort(
          (a, b) => Date.parse(b.submittedAt ?? '') - Date.parse(a.submittedAt ?? ''),
        )
      : filtered;

  const waiting = reviews.filter((review) => review.status === 'under_review').length;
  const returned = reviews.filter((review) => review.status === 'changes_requested').length;
  const ready = reviews.filter(canApprove).length;

  return (
    <>
      <PageHeader
        eyebrow="Review queue"
        title={
          waiting === 0 ? 'Nothing is waiting' : `${waiting} waiting on a decision`
        }
        subtitle={
          waiting === 0
            ? 'New submissions appear here automatically, oldest first.'
            : 'Longest waiting first. The green edge marks the applications whose documents have all been accepted already — those need a decision, not a review.'
        }
      >
        <div className="flex flex-wrap gap-2">
          <HeaderStat
            value={ready}
            label="ready to approve"
            tone={ready > 0 ? 'positive' : 'neutral'}
            delay={160}
          />
          <HeaderStat
            value={waiting - ready > 0 ? waiting - ready : 0}
            label="still to check"
            tone="info"
            delay={200}
          />
          <HeaderStat
            value={returned}
            label="awaiting re-upload"
            tone={returned > 0 ? 'caution' : 'neutral'}
            delay={240}
          />
        </div>
      </PageHeader>

      {reviews.length > 0 ? (
        <QueueFilters
          total={reviews.length}
          shown={ordered.length}
          counts={counts}
          view={view}
        />
      ) : null}

      {reviews.length === 0 ? (
        <Card>
          <EmptyState
            title="The queue is clear"
            message="No registrations are waiting. New submissions appear here automatically."
          />
        </Card>
      ) : ordered.length === 0 ? (
        <Card>
          <EmptyState
            title={query ? 'Nothing matches that search' : 'Nothing in this filter'}
            message={
              query
                ? 'Try a name, a council registration number, or a city.'
                : 'Every open application sits under one of the other filters.'
            }
          />
        </Card>
      ) : (
        // A card at desktop width, where the table needs a surface to sit on;
        // bare below it, where the rows are already cards of their own and a
        // card inside a card is two borders saying the same thing.
        <div className="lg:rounded-[var(--radius-card)] lg:border lg:border-border lg:bg-surface lg:px-4 lg:py-3 lg:shadow-[var(--shadow-card)]">
          <QueueTable reviews={ordered} />
        </div>
      )}
    </>
  );
}

function inView(review: DoctorReview, view: QueueView): boolean {
  switch (view) {
    case 'ready':
      return canApprove(review);
    case 'waiting':
      return review.status === 'under_review' && !canApprove(review);
    case 'returned':
      return review.status === 'changes_requested';
    default:
      return true;
  }
}
