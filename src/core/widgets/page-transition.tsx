'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/// Replays the page entrance on every route change.
///
/// A CSS animation runs once, when the element is first painted. In the App
/// Router the shell persists across navigations, so without a changing `key`
/// the content area animates on the very first load of the console and never
/// again — the reviewer sees one nice entrance in the morning and forty flat
/// swaps after it.
///
/// Keyed on the pathname rather than on the full URL on purpose. The queue's
/// search and sort live in the query string, and re-keying on those would tear
/// down the filter controls mid-keystroke and animate the whole table for what
/// is a filter, not a navigation.
export function PageTransition({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-rise">
      {children}
    </div>
  );
}
