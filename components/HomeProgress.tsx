'use client';

import { useEffect, useRef } from 'react';
import { useUX, view } from '@/lib/store';

/**
 * Homepage scroll progress, pinned to the bottom centre — in the gap between the ‹ ›
 * controls (bottom-left) and the Kai launcher (bottom-right).
 *
 * At 992px and up it reads as the CMS sentence itself: two identical copies stacked, a
 * dim one underneath and a bright one on top that's clipped to how far you've scrolled,
 * so the sentence fills in as you travel it. Narrower than that there isn't room for
 * ~165 characters, so it falls back to the plain rule.
 *
 * Progress is read from `view` in a rAF loop and written straight to the DOM: it changes
 * every frame, and re-rendering React at 60fps to move a line would be wasteful.
 */
export default function HomeProgress() {
  const sentence = useUX((s) => s.content?.sentence ?? '');

  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);

  // Scale the sentence to fill the space between the two corner CTAs exactly. Measured
  // rather than set with a font-size clamp: the sentence is editable, so its natural
  // width changes with the content. Scaling a transform (rather than the font size)
  // keeps both layers in lockstep, so the fill can't drift out of register.
  useEffect(() => {
    const fit = () => {
      const room = track.current?.clientWidth ?? 0;
      // offsetWidth is the element's LAYOUT width — transforms don't affect it, so this
      // stays the unscaled natural width no matter how many times fit() runs.
      const natural = scaler.current?.offsetWidth ?? 0;
      if (!scaler.current || !room || !natural) return;
      scaler.current.style.transform = `translate(-50%, -50%) scale(${room / natural})`;
    };
    fit();
    // Re-measure once New Spirit has actually loaded — measuring against the fallback
    // font gives the wrong natural width and so the wrong scale.
    document.fonts?.ready.then(fit).catch(() => {});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [sentence]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = Math.min(1, Math.max(0, view.p));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      // Clip the bright copy from the right, so it's revealed left-to-right.
      if (fill.current) fill.current.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    // Side padding clears the ‹ › controls and the Kai launcher in the bottom corners.
    <div
      aria-hidden
      // Mirrors the ‹ › controls' own box exactly — same bottom offset at each
      // breakpoint (they shift to bottom-8 from `sm`) and the same 40px height — so
      // items-center lands this on their vertical centre line. The side padding clears
      // the controls (which end 124px in once they move to left-8) and the Kai launcher.
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex h-10 items-center justify-center px-32 sm:bottom-8 sm:px-36"
    >
      <div ref={track} className="relative w-full">
        {/* Under 992px: the plain rule. */}
        <div className="h-px w-full bg-white/15 min-[992px]:hidden">
          <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-[#ff6666]" />
        </div>

        {/* 992px and up: the sentence, filling in as you scroll. */}
        <div className="hidden h-[13px] min-[992px]:block">
          {/* w-max so the box is the sentence's TRUE width — an auto-width inline-block
              is capped at the space available, which would make it measure as though it
              already fit and never scale. Centred by transform rather than text-align,
              which stays exact even while the unscaled text is wider than the track.
              Type styles sit here so both copies inherit identical metrics, and both are
              block boxes of the same size, so the bright copy lands precisely over the
              dim one (an inline copy would sit in a taller line box and ride high). */}
          <div
            ref={scaler}
            style={{ transform: 'translate(-50%, -50%)' }}
            className="font-spirit absolute left-1/2 top-1/2 w-max whitespace-nowrap text-[13px] font-medium leading-none tracking-tight"
          >
            <span className="block text-white/25">
              {sentence}
            </span>
            <span
              ref={fill}
              style={{ clipPath: 'inset(0 100% 0 0)' }}
              className="absolute inset-0 block text-[#ff6666]"
            >
              {sentence}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
