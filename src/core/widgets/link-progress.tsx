'use client';

import { useLinkStatus } from 'next/link';

/// The bar across the top of the window while a navigation is in flight.
///
/// Every screen in this console is `force-dynamic`, so a click is a round trip
/// to the API before any of the next page exists. `loading.tsx` covers the two
/// slowest routes, but a route without one leaves the reviewer looking at the
/// page they just clicked away from, with nothing to say the click landed. That
/// reads as a dead button, and a dead button gets clicked again.
///
/// `useLinkStatus` only reports for the `<Link>` it is rendered inside, so this
/// goes *in* the link — but what it draws is fixed to the viewport. Only one
/// navigation can be pending at a time, so one instance is ever on screen and
/// the effect is a global progress bar without a global store to keep in sync.
///
/// `pointer-events-none` because it lives inside an anchor: without it, the
/// strip along the top of the window would be a click target for whichever
/// link happens to be loading.
export function LinkProgress() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      role="status"
      aria-label="Loading the next screen"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 block h-0.5 overflow-hidden bg-info-surface"
    >
      <span className="animate-sweep block h-full w-full origin-left bg-primary-vivid" />
    </span>
  );
}

/// The same signal, local to the control that was clicked.
///
/// The top bar says "something is loading"; this says "the thing you clicked is
/// loading". On a queue of forty rows that difference is the whole point — a
/// reviewer needs to know their row registered, not that the app is busy.
export function PendingDot({ className = '' }: { readonly className?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`inline-block size-1.5 shrink-0 rounded-full bg-current transition-opacity duration-200 ${
        pending ? 'animate-halo opacity-100' : 'opacity-0'
      } ${className}`}
    />
  );
}
