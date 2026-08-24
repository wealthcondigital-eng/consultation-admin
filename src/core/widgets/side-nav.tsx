'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { LinkProgress, PendingDot } from '@/core/widgets/link-progress';

/// The console's navigation, in two shapes.
///
/// The first pass had the sidebar as `hidden lg:flex` and nothing else, which
/// meant a reviewer on a tablet — or anyone with a browser window narrower than
/// 1024px — had **no way to move between screens at all**. `SideNav` is the
/// wide-screen rail; `TopNav` is the row of tabs that replaces it below that
/// breakpoint. Same items, same active-state logic, one source of truth.
///
/// The active item is marked twice over: a tinted pill behind it, and a bar
/// down its left edge that grows into place. Two signals rather than one
/// because the tint alone is faint at a glance and the bar alone disappears
/// against a busy screen — and because the bar is the thing that moves, which
/// is what makes a click feel answered before the next screen has loaded.
interface Item {
  href: string;
  label: string;
  short: string;
  hint: string;
  icon: ReactNode;
}

const ITEMS: readonly Item[] = [
  {
    href: '/overview',
    label: 'Overview',
    short: 'Overview',
    hint: 'Today at a glance',
    icon: <GridIcon />,
  },
  {
    href: '/queue',
    label: 'Review queue',
    short: 'Queue',
    hint: 'Waiting on a decision',
    icon: <QueueIcon />,
  },
  {
    href: '/decided',
    label: 'Decided',
    short: 'Decided',
    hint: 'Already has an outcome',
    icon: <ArchiveIcon />,
  },
  {
    href: '/audit',
    label: 'Audit trail',
    short: 'Audit',
    hint: 'Who did what, when',
    icon: <TrailIcon />,
  },
];

/// `startsWith` so an application detail page keeps the queue lit.
function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ pendingCount }: { readonly pendingCount: number }) {
  const isActive = useActive();

  return (
    <nav aria-label="Sections" className="space-y-1">
      <p className="text-meta-label mb-2 px-3">Workspace</p>

      {ITEMS.map((item, index) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            title={item.hint}
            style={{ animationDelay: `${60 + index * 45}ms` }}
            className={`animate-slide-in press group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-semibold ${
              active
                ? 'bg-primary-surface text-primary-deep'
                : 'text-text-secondary hover:bg-surface-muted hover:text-text-label'
            }`}
          >
            <LinkProgress />

            {/* The rail. Always rendered, so it scales between states instead
                of appearing from nothing — an element that pops in reads as a
                second thing arriving rather than as this thing changing. */}
            <span
              aria-hidden="true"
              className={`absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-vivid transition-transform duration-300 ease-[var(--ease-spring)] ${
                active ? 'scale-y-100' : 'scale-y-0'
              }`}
            />

            <span
              className={`transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-110 ${
                active ? 'text-primary-vivid' : 'text-text-tertiary'
              }`}
            >
              {item.icon}
            </span>

            <span className="flex-1 truncate">{item.label}</span>

            {item.href === '/queue' && pendingCount > 0 ? (
              <Count n={pendingCount} />
            ) : (
              <PendingDot />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/// The small-screen equivalent. Horizontally scrollable rather than collapsed
/// into a hamburger: four destinations fit, and a menu that has to be opened to
/// see where you are is worse than a row you can read at a glance.
export function TopNav({ pendingCount }: { readonly pendingCount: number }) {
  const isActive = useActive();

  return (
    <nav
      aria-label="Sections"
      className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`press relative flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold ${
              active
                ? 'bg-primary-surface text-primary-deep'
                : 'text-text-secondary hover:bg-surface-muted'
            }`}
          >
            <LinkProgress />
            <span className={active ? 'text-primary-vivid' : 'text-text-tertiary'}>
              {item.icon}
            </span>
            {item.short}
            {item.href === '/queue' && pendingCount > 0 ? <Count n={pendingCount} /> : null}

            {/* The mobile row has no space for a left rail, so the active tab
                is underlined instead — and the underline grows from the centre
                rather than being drawn all at once. */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary-vivid transition-transform duration-300 ease-[var(--ease-spring)] ${
                active ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function Count({ n }: { readonly n: number }) {
  return (
    <span className="tabular animate-pop rounded-full bg-primary-vivid px-2 py-0.5 text-xs font-bold text-white shadow-[0_1px_4px_rgb(37_99_235/0.4)]">
      {n}
    </span>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M3 3h6v6H3V3Zm8 0h6v6h-6V3ZM3 11h6v6H3v-6Zm8 0h6v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M3 6h14v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Zm-.5-3h15v3h-15V3ZM8 10h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
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
