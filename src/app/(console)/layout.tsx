import { redirect } from 'next/navigation';
import Link from 'next/link';

import { isFake } from '@/core/config/app-config';
import { reviewGraph } from '@/core/di/injector';
import { readSession } from '@/core/session/admin-session';
import { BrandMark } from '@/core/widgets/brand-mark';
import { PageTransition } from '@/core/widgets/page-transition';
import { SideNav, TopNav } from '@/core/widgets/side-nav';
import { signOutAction } from '@/features/admin-auth/presentation/actions';

/// The console shell, and the auth guard for everything inside it.
///
/// Every route in this group is server-rendered behind this check, so there is
/// no moment where an unauthenticated browser holds queue data and no
/// client-side redirect to race.
///
/// Two layouts, not one: a sidebar rail from 1024px up, and a compact header
/// with a tab row below it. The first pass only had the rail, which left
/// narrower windows with no navigation at all.
export default async function ConsoleLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect('/login');

  // Failing to load the badge must not take the whole shell down — the nav is
  // still navigable without a count on it.
  let pendingCount = 0;
  try {
    const { repository } = await reviewGraph();
    pendingCount = (await repository.fetchSummary()).pending;
  } catch {
    pendingCount = 0;
  }

  const initials = session.fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative flex min-h-dvh bg-canvas">
      {/* A wash of colour behind the top of the canvas, drifting slowly enough
          that it is never the thing you are looking at. It gives the content
          column a horizon to sit under; without it a page of white cards on a
          near-white canvas has no top. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-80 overflow-hidden"
      >
        <div className="animate-drift absolute -top-40 left-1/3 size-[38rem] rounded-full bg-primary-soft/8 blur-3xl" />
        <div
          className="animate-drift absolute -top-52 right-10 size-[28rem] rounded-full bg-success/6 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
      </div>

      {/* --- Wide: the sidebar rail ------------------------------------- */}
      <aside className="sticky top-0 z-20 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link href="/overview" className="group mb-7 flex items-center gap-2.5 px-1">
          <BrandMark />
          <span className="min-w-0">
            <span className="text-nav-title block leading-tight">Approvals</span>
            <span className="block text-xs text-text-tertiary">Doctor credentialing</span>
          </span>
        </Link>

        <SideNav pendingCount={pendingCount} />

        <div className="mt-auto space-y-3 pt-6">
          {isFake ? (
            <p className="animate-fade flex items-center gap-2 rounded-[var(--radius-chip)] bg-warning-surface px-2.5 py-2 text-xs font-semibold text-warning ring-1 ring-warning/15 ring-inset">
              <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning" />
              Demo data — no API connected
            </p>
          ) : null}

          <div className="group flex items-center gap-3 rounded-[var(--radius-control)] border border-transparent px-2 py-2 transition-colors duration-200 hover:border-border hover:bg-surface-muted">
            <Avatar initials={initials} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                {session.fullName}
              </p>
              <p className="truncate text-xs text-text-tertiary">{session.email}</p>
            </div>
          </div>

          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* --- Narrow: header + tab row ---------------------------------- */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-5 pt-3 backdrop-blur-xl lg:hidden">
          <div className="mb-2 flex items-center gap-3">
            <Link href="/overview" className="group flex items-center gap-2">
              <BrandMark />
              <span className="text-nav-title">Approvals</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              {isFake ? (
                <span className="rounded-[var(--radius-chip)] bg-warning-surface px-2 py-1 text-xs font-semibold text-warning">
                  Demo
                </span>
              ) : null}
              <Avatar initials={initials} title={`${session.fullName} · ${session.email}`} />
              <form action={signOutAction}>
                <SignOutButton compact />
              </form>
            </div>
          </div>

          <TopNav pendingCount={pendingCount} />
        </header>

        {/* min-w-0 so a wide table scrolls inside its own container instead of
            stretching the page — the console must never scroll horizontally. */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}

function Avatar({ initials, title }: { readonly initials: string; readonly title?: string }) {
  return (
    <span
      title={title}
      aria-hidden={title ? undefined : 'true'}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-surface to-info-surface text-sm font-bold text-primary-deep ring-1 ring-primary-soft/20 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105"
    >
      {initials}
    </span>
  );
}

function SignOutButton({ compact = false }: { readonly compact?: boolean }) {
  return (
    <button
      type="submit"
      className={`press cursor-pointer rounded-[var(--radius-control)] border border-border font-semibold text-text-label hover:border-danger/40 hover:bg-danger-surface hover:text-danger ${
        compact ? 'px-2.5 py-2 text-xs' : 'w-full px-3 py-2 text-sm'
      }`}
    >
      Sign out
    </button>
  );
}
