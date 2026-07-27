'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Native scroll, halved and given momentum.
 *
 * The document really does scroll — an empty spacer is sized to hold the scrollbar, so
 * the trackpad, mouse wheel, scrollbar dragging, Page Up/Down, Home/End, find-in-page
 * and anchor links all behave exactly as the browser intends. What changes is the
 * mapping from scroll offset to content offset:
 *
 *   spacer height = travel * SPEED_DIVISOR + viewport   →   content moves at half speed
 *   content y     = damp(current → scrollY / SPEED_DIVISOR)  →  momentum / glide
 *
 * Because the scrollbar is stretched rather than the wheel being intercepted, every
 * input device slows by exactly the same factor and nothing is swallowed.
 */

/** 2 = the page travels half as far as the scroll gesture asks for. */
const SPEED_DIVISOR = 2;
/** Fraction of the remaining distance closed each 60Hz frame — lower glides longer. */
const EASE = 0.085;
/** Below this, snap: sub-pixel chasing keeps the rAF loop and the GPU awake forever. */
const EPSILON = 0.05;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  /** Scrollable travel of the content itself, in px (content height - viewport). */
  const travel = useRef(0);
  const [spacerHeight, setSpacerHeight] = useState(0);
  /** Off until we've confirmed a device that benefits: pointer-driven, motion allowed. */
  const [smooth, setSmooth] = useState(false);

  // Touch devices already have momentum, and a fixed+transformed layer fights their
  // address-bar resizing; reduced-motion users asked for none of this. Both fall back
  // to plain document flow, where the browser's own scrolling is untouched.
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSmooth(fine.matches && !noMotion.matches);
    update();
    fine.addEventListener('change', update);
    noMotion.addEventListener('change', update);
    return () => {
      fine.removeEventListener('change', update);
      noMotion.removeEventListener('change', update);
    };
  }, []);

  // Restoring a scroll position into a rig that hasn't measured itself yet lands
  // somewhere arbitrary, so we take that over and start at the top.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  // Measure the content and size the spacer. ResizeObserver catches font swaps, image
  // loads and viewport changes without polling.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const height = el.getBoundingClientRect().height;
      travel.current = Math.max(0, height - window.innerHeight);
      setSpacerHeight(smooth ? travel.current * SPEED_DIVISOR + window.innerHeight : 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [smooth]);

  // The animation loop. Runs in both modes: even when the content isn't transformed,
  // the nav's scroll-progress rule still needs driving.
  useEffect(() => {
    const el = contentRef.current;
    const progress = document.getElementById('scroll-progress');
    let current = 0;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Normalise the easing to 60Hz so a 120Hz display doesn't glide twice as fast.
      const steps = Math.min((now - last) / (1000 / 60), 4);
      last = now;

      const max = travel.current;
      const target = smooth ? Math.min(window.scrollY / SPEED_DIVISOR, max) : window.scrollY;

      if (smooth) {
        const delta = target - current;
        current = Math.abs(delta) < EPSILON ? target : current + delta * (1 - Math.pow(1 - EASE, steps));
        if (el) el.style.transform = `translate3d(0, ${-current}px, 0)`;
      } else {
        current = target;
      }

      if (progress) {
        const p = max > 0 ? Math.min(current / max, 1) : 0;
        progress.style.transform = `scaleX(${p})`;
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (el) el.style.transform = '';
    };
  }, [smooth]);

  return (
    <>
      <div ref={contentRef} className={smooth ? 'smooth-content' : 'relative z-10'}>
        {children}
      </div>
      {/* Holds the native scrollbar open to the stretched length. Only present in
          smooth mode — in fallback mode the content itself provides the height. */}
      {smooth && <div aria-hidden="true" style={{ height: spacerHeight }} />}
    </>
  );
}
