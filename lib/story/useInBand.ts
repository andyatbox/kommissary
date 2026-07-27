'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Tracks whether an element's centre is inside the reading band — a region centred on
 * the window, BAND_FRACTION of its height. Used to decide when a section is "the one
 * being read", and so when to offer its Gallery.
 *
 * One rAF loop serves every subscriber. It reads rects rather than using an
 * IntersectionObserver deliberately: the page is scrolled by a transform on a fixed
 * layer (see SmoothScroll), and measuring the real rect each frame is guaranteed to
 * track that, where IO's behaviour under a purely transform-driven ancestor is far
 * less predictable across browsers.
 */

/** Height of the band as a fraction of the window — centred, so 0.75 spans 12.5%–87.5%. */
export const BAND_FRACTION = 0.75;

type Entry = {
  el: HTMLElement;
  inBand: boolean;
  notify: (value: boolean) => void;
};

const entries = new Set<Entry>();
let raf = 0;

function tick() {
  raf = requestAnimationFrame(tick);
  const half = (window.innerHeight * BAND_FRACTION) / 2;
  const top = window.innerHeight / 2 - half;
  const bottom = window.innerHeight / 2 + half;

  entries.forEach((entry) => {
    const rect = entry.el.getBoundingClientRect();
    const centre = rect.top + rect.height / 2;
    const next = centre >= top && centre <= bottom;
    if (next !== entry.inBand) {
      entry.inBand = next;
      entry.notify(next);
    }
  });
}

export function useInBand(ref: RefObject<HTMLElement>): boolean {
  const [inBand, setInBand] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const entry: Entry = { el, inBand: false, notify: setInBand };
    entries.add(entry);
    if (entries.size === 1) raf = requestAnimationFrame(tick);

    return () => {
      entries.delete(entry);
      if (entries.size === 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
  }, [ref]);

  return inBand;
}
