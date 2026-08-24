import type { ReactNode } from 'react';

import {
  STATUS_LABELS,
  type ApplicationStatus,
  type DocumentDecision,
} from '@/features/doctor-review/domain/entities/doctor-review';

/// A status pill. The tinted-surface pairs come straight from `AppColors` —
/// `successSurface`/`success`, `primarySurface`/`primaryDeep` and so on — so a
/// badge here reads the same as a badge in the app.
type Tone = 'neutral' | 'info' | 'positive' | 'negative' | 'caution';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-text-secondary ring-border',
  info: 'bg-primary-surface text-primary-deep ring-info-surface',
  positive: 'bg-badge-surface text-success ring-success-surface',
  negative: 'bg-danger-surface text-danger ring-danger/20',
  caution: 'bg-warning-surface text-warning ring-warning/20',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  live = false,
}: {
  readonly children: ReactNode;
  readonly tone?: Tone;
  readonly dot?: boolean;
  /// Gives the dot a slow pulse. Reserved for the one status that means
  /// "somebody still has to do something" — if every badge pulsed, the pulse
  /// would stop meaning anything.
  readonly live?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] px-2 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}
    >
      {dot ? (
        <span className="relative grid size-1.5 shrink-0 place-items-center">
          {live ? (
            <span className="absolute size-1.5 animate-ping rounded-full bg-current opacity-60" />
          ) : null}
          <span className="size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<ApplicationStatus, Tone> = {
  draft: 'neutral',
  under_review: 'info',
  changes_requested: 'caution',
  approved: 'positive',
  rejected: 'negative',
};

export function StatusBadge({ status }: { readonly status: ApplicationStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot live={status === 'under_review'}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

const DECISION_TONES: Record<DocumentDecision, Tone> = {
  pending: 'caution',
  accepted: 'positive',
  rejected: 'negative',
};

const DECISION_LABELS: Record<DocumentDecision, string> = {
  pending: 'Awaiting review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function DecisionBadge({ decision }: { readonly decision: DocumentDecision }) {
  return (
    <Badge tone={DECISION_TONES[decision]} dot live={decision === 'pending'}>
      {DECISION_LABELS[decision]}
    </Badge>
  );
}
