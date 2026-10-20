'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The Our Story scroll feel (half speed, with a glide) on every other scrolling page, for
 * mouse wheels and trackpads.
 *
 * Our Story gets it by moving a fixed layer (components/story/SmoothScroll), which
 * suits a 3D scene but not ordinary pages: content in a fixed layer can't blend with the
 * gradient behind it (Body Copy's exclusion card), can't hold position:fixed elements
 * (the lead pages' floating buttons), and isn't scrolled into view for focus, #links or
 * find-in-page. So here the page scrolls natively and only the wheel is eased: each
 * wheel delta moves a target by half, and the real scroll position glides after it with
 * Our Story's own easing. Everything else that scrolls the page (keys, the scrollbar,
 * links, find) is left alone and simply taken over from.
 *
 * Also drives the nav's scroll-progress rule on these pages, as SmoothScroll does on
 * Our Story.
 */

/** Not here: pages that don't scroll, or bring their own (the homepage's 3D camera, the
 *  Our Impact slider, Our Story's SmoothScroll). */
const SKIP = new Set(['/', '/our-impact', '/our-story']);

/** Matches Our Story: half the wheel's distance, closing 8.5% of the gap per 60Hz frame. */
const SPEED = 0.5;
const EASE = 0.085;
/** Below this, settle: chasing sub-pixels keeps the loop awake for nothing. */
const EPSILON = 0.5;

/** Whether `el` or something between it and the page can still scroll by dy itself
 *  (the Kai chat, the mobile menu, a scrolling box): if so, the wheel is its. */
function innerScroller(el: Element | null, dy: number): boolean {
  for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n);
    if ((overflowY === 'auto' || overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
      if (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
    }
  }
  return false;
}

export default function SmoothWheel() {
  const pathname = usePathname();
  const skip = SKIP.has(pathname);

  useEffect(() => {
    if (skip) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const progress = document.getElementById('scroll-progress');
    const max = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    let target = window.scrollY;
    let current = target;
    let gliding = false;
    let raf = 0;
    let last = 0;

    const setProgress = () => {
      const m = max();
      if (progress) progress.style.transform = `scaleX(${m > 0 ? Math.min(window.scrollY / m, 1) : 0})`;
    };

    const frame = (now: number) => {
      const steps = Math.min((now - last) / (1000 / 60), 4);
      last = now;
      target = Math.min(target, max());
      const delta = target - current;
      current = Math.abs(delta) < EPSILON ? target : current + delta * (1 - Math.pow(1 - EASE, steps));
      window.scrollTo(0, current);
      if (current === target) gliding = false;
      else raf = requestAnimationFrame(frame);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey || !fine.matches || noMotion.matches) return;
      // Sideways is left native (sliders, shift-scroll).
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      if (innerScroller(e.target instanceof Element ? e.target : null, e.deltaY)) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 33;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (!gliding) target = current = window.scrollY;
      target = Math.min(max(), Math.max(0, target + d * SPEED));
      if (!gliding) {
        gliding = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // Something else moved the page mid-glide (a key, the scrollbar, a link): stop and
    // follow it rather than pulling it back.
    const onScroll = () => {
      setProgress();
      if (gliding && Math.abs(window.scrollY - current) > 3) {
        cancelAnimationFrame(raf);
        gliding = false;
        target = current = window.scrollY;
      }
    };

    setProgress();
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setProgress);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', setProgress);
      if (progress) progress.style.transform = 'scaleX(0)';
    };
  }, [skip, pathname]);

  return null;
}
