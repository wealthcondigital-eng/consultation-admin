import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { Card, CardHeader } from '@/core/widgets/card';
import { EmptyState } from '@/core/widgets/empty-state';
import { HeaderStat, PageHeader } from '@/core/widgets/page-header';
import { Reveal } from '@/core/widgets/reveal';
import { EventTimeline } from '@/features/doctor-review/presentation/widgets/event-timeline';
import { actionTone } from '@/features/doctor-review/domain/entities/verification-event';

export const dynamic = 'force-dynamic';

/// Every decision anyone has made, newest first.
export default async function AuditPage() {
  let events;

  try {
    const { repository } = await reviewGraph();
    events = await repository.fetchEvents();
  } catch (error) {
    return (
      <Card>
        <EmptyState tone="error" title="Could not load the trail" message={messageFor(error)} />
      </Card>
    );
  }

  const approvals = events.filter((event) => actionTone(event.action) === 'positive').length;
  const refusals = events.filter((event) => actionTone(event.action) === 'negative').length;
  const submissions = events.filter((event) => event.action === 'submitted').length;

  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title={`${events.length} recorded event${events.length === 1 ? '' : 's'}`}
        subtitle="Every submission and decision, in order. Entries are never edited or removed — you will be asked who approved a given doctor and when, and this is the answer."
      >
        <div className="flex flex-wrap gap-2">
          <HeaderStat value={submissions} label="submissions" delay={160} />
          <HeaderStat value={approvals} label="acceptances" tone="positive" delay={200} />
          <HeaderStat value={refusals} label="refusals" tone="negative" delay={240} />
        </div>
      </PageHeader>

      <Reveal delay={200}>
        <Card>
          <CardHeader
            title="Full history"
            subtitle="Grouped by day, newest first. The date stays pinned as you scroll."
            icon={<TrailGlyph />}
          />
          <EventTimeline events={events} showDoctor grouped />
        </Card>
      </Reveal>
    </>
  );
}

function TrailGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
      <path
        d="M6 4v12M14 8v4a2 2 0 0 1-2 2H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="3" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
