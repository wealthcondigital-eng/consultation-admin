'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SplashVisual } from '@/core/widgets/splash-visual';

/// The splash shown while the root route sends a signed-in reviewer onward.
///
/// This is the *navigating* case: there is a real wait here, because `/overview`
/// is a dynamic route that has to reach the API before it can render. Two
/// things keep that honest:
///
///  * the destination is **prefetched the instant this mounts**, so the wait is
///    doing real work — by the time the animation ends the next screen is
///    usually already in the router cache;
///  * the hold is `MINIMUM_MS` and no longer. A splash that outlives the work
///    it covers is just a delay with a logo on it.
///
/// The signed-*out* case does not come through here at all. `/` redirects
/// straight to `/login`, and `SplashIntro` plays the splash over the form
/// there — otherwise a visitor with no session would sit through it twice,
/// once on the way out of `/` and again on arrival.
const MINIMUM_MS = 1400;

export function SplashScreen({
  target,
  firstName,
}: {
  readonly target: string;
  /// Set when a session was restored. Naming the person who is already signed
  /// in is the one thing this screen can say that a spinner cannot.
  readonly firstName: string | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<'checking' | 'opening'>('checking');

  useEffect(() => {
    // Warm the destination immediately. This is the whole justification for the
    // screen existing.
    router.prefetch(target);

    const half = setTimeout(() => setPhase('opening'), MINIMUM_MS * 0.55);
    const go = setTimeout(() => router.replace(target), MINIMUM_MS);

    return () => {
      clearTimeout(half);
      clearTimeout(go);
    };
  }, [router, target]);

  return (
    <main>
      <SplashVisual
        durationMs={MINIMUM_MS}
        status={
          phase === 'checking'
            ? 'Checking your session…'
            : firstName
              ? `Welcome back, ${firstName}`
              : 'Opening the console…'
        }
      />

      {/* The whole point of the screen is that it leaves. Anyone who lands here
          with JavaScript off would otherwise be stranded on it. */}
      <noscript>
        <a
          href={target}
          className="fixed inset-x-0 bottom-14 mx-auto w-fit rounded-[var(--radius-control)] bg-white/15 px-4 py-2 text-sm font-semibold text-white underline"
        >
          Continue
        </a>
      </noscript>
    </main>
  );
}
