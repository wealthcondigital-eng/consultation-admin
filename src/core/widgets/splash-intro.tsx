'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { SplashVisual } from '@/core/widgets/splash-visual';

/// Plays the splash over a screen that is already rendered, then hands over.
///
/// The sign-in page is the reason this exists. The root route shows the splash
/// *while it navigates somewhere else*, which does nothing for anyone who opens
/// `/login` directly — a bookmark, a sign-out redirect, a pasted link. They saw
/// the form and never the splash.
///
/// So the splash comes to the form rather than the form coming after the
/// splash. The page underneath is rendered and mounted the whole time: this
/// covers it, it does not delay it. When the timer ends the cover fades and the
/// form is already there, focusable and ready — nothing is fetched or built at
/// the moment of handover.
///
/// Two phases rather than one flag, because a cover that vanishes is a worse
/// cut than one that fades: `covering` holds it opaque, `leaving` fades it out
/// while the form fades in underneath, and only then is it unmounted.
const HOLD_MS = 1200;
const FADE_MS = 400;

export function SplashIntro({
  children,
  status = 'Opening the sign-in form…',
}: {
  readonly children: ReactNode;
  readonly status?: string;
}) {
  const [phase, setPhase] = useState<'covering' | 'leaving' | 'done'>('covering');

  useEffect(() => {
    const leave = setTimeout(() => setPhase('leaving'), HOLD_MS);
    const finish = setTimeout(() => setPhase('done'), HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(leave);
      clearTimeout(finish);
    };
  }, []);

  const covered = phase !== 'done';

  return (
    <>
      {/* `inert` rather than only `aria-hidden`: while the cover is up, a Tab
          press must not land the caret in an email field nobody can see. */}
      <div
        inert={covered ? true : undefined}
        className={`transition-opacity duration-500 ${
          covered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {children}
      </div>

      {phase !== 'done' ? (
        <div
          aria-hidden={phase === 'leaving'}
          className={`fixed inset-0 z-50 transition-opacity ease-[var(--ease-out-quint)] ${
            phase === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          <SplashVisual status={status} durationMs={HOLD_MS} />
        </div>
      ) : null}
    </>
  );
}
