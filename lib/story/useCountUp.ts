'use client';

import { useEffect, useRef, useState } from 'react';

/** How long a single counter takes to settle, once it starts. */
const DURATION = 1600;

/** Starts fast and eases into the final number, rather than ticking at a constant
 *  rate or lingering at the start — reads better for a counter than linear. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates from 0 up to `target` the first time `start` becomes true, then holds at
 * `target`. `delay` (ms) staggers a group of counters so they don't all land in
 * lockstep — see MillionsServed.tsx, which offsets each stat by its index.
 */
export function useCountUp(target: number, start: boolean, delay = 0): number {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!start || started.current) return;
    started.current = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let raf = 0;
    const begin = performance.now() + delay;

    const frame = (now: number) => {
      if (now < begin) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = Math.min((now - begin) / DURATION, 1);
      setValue(target * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [start, target, delay]);

  return value;
}
