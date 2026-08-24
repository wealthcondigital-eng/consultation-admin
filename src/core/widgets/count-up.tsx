'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/// A number that counts up to itself when the tile first paints.
///
/// The reason it is worth the client boundary: the overview is five numbers,
/// and five static numbers all land at once and read as wallpaper. A figure
/// that moves is a figure the eye stops on — which is the entire job of a
/// number on a dashboard.
///
/// Three things it does not do, on purpose:
///
///  * It never animates on a re-render, only on mount. A count that re-runs
///    every time the page revalidates is a distraction, not a signal.
///  * It renders the **final** value during SSR, so the number is correct with
///    JavaScript disabled and correct for anything reading the markup.
///  * It honours `prefers-reduced-motion` by skipping straight to the value.
export function CountUp({
  value,
  duration = 850,
  format,
}: {
  readonly value: number;
  readonly duration?: number;
  /// Wraps the running figure — `(n) => n + 'h'` and the like. Applied to the
  /// intermediate values too, so a suffix does not pop in at the end.
  readonly format?: (value: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const hasRun = useRef(false);

  // Before paint, not after: setting the counter back to zero in a plain
  // effect shows the final number for one frame first, which looks like a bug.
  useIsomorphicLayoutEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (value === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setShown(0);
  }, [value]);

  useEffect(() => {
    if (shown === value) return;

    let frame = 0;
    const started = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      // The same quintic ease as the CSS entrances, so the number settles on
      // the beat the card it sits in settles on.
      const eased = 1 - Math.pow(1 - progress, 5);

      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Runs once, when the layout effect above has knocked `shown` down to zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = format ? format(shown) : String(shown);
  const final = format ? format(value) : String(value);

  // The label carries the settled figure so a screen reader is never read a
  // number that was true for sixteen milliseconds.
  return (
    <span aria-label={final}>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
