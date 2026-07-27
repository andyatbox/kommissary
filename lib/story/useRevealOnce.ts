'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Fires once — the first time an element's box arrives within reach of the viewport —
 * and never again. Meant for triggering a run-once entrance animation (see
 * useCountUp.ts), not a toggling "is this visible" state; see useInBand.ts for that.
 *
 * Built on the same rAF + getBoundingClientRect() approach as useInBand.ts, and for
 * the same reason: the page is scrolled by a transform on a fixed layer (see
 * SmoothScroll), and IntersectionObserver's behaviour under a purely
 * transform-driven ancestor isn't dependable across browsers, where reading the real
 * rect each frame is guaranteed to track it.
 */

/** Trigger once the element's top is within this much of the viewport height from the
 *  bottom edge — a bit of lead-in, so a count-up animation is mostly finished by the
 *  time the section is actually centred and being read, not started only then. */
const LEAD_IN = 0.15;

type Entry = {
  el: HTMLElement;
  notify: () => void;
};

const entries = new Set<Entry>();
let raf = 0;

function tick() {
  raf = requestAnimationFrame(tick);
  const threshold = window.innerHeight * (1 - LEAD_IN);

  entries.forEach((entry) => {
    const rect = entry.el.getBoundingClientRect();
    if (rect.top <= threshold && rect.bottom >= 0) {
      entries.delete(entry);
      entry.notify();
    }
  });

  // Unlike useInBand's loop, entries here are removed by the tick itself (once fired,
  // never again) rather than only on unmount — so the loop must also check here,
  // or a page whose last watcher fires (rather than unmounts) never stops ticking.
  if (entries.size === 0) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

export function useRevealOnce(ref: RefObject<HTMLElement>): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el) return;

    const entry: Entry = { el, notify: () => setRevealed(true) };
    entries.add(entry);
    if (entries.size === 1) raf = requestAnimationFrame(tick);

    return () => {
      entries.delete(entry);
      if (entries.size === 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
  }, [ref, revealed]);

  return revealed;
}
