'use client';

import { useEffect, useMemo, useRef } from 'react';
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
 * The sentence is broken across two lines. It's scaled to fill the track, so halving the
 * width it has to span roughly doubles the type size — the only way to read it larger in
 * a strip this wide.
 *
 * Progress is read from `view` in a rAF loop and written straight to the DOM: it changes
 * every frame, and re-rendering React at 60fps to move a line would be wasteful.
 */
/**
 * Break the sentence in two at the word boundary closest to its middle, so the lines come
 * out near enough the same length. Character count stands in for width — close enough at
 * this size, and it avoids measuring every candidate split.
 */
function splitInTwo(sentence: string): [string, string] {
  const words = sentence.split(' ');
  if (words.length < 2) return [sentence, ''];
  const target = sentence.length / 2;
  let best = 1;
  let bestDiff = Infinity;
  let len = 0;
  for (let i = 0; i < words.length - 1; i++) {
    len += (i > 0 ? 1 : 0) + words[i].length;
    const diff = Math.abs(len - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i + 1;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export default function HomeProgress({ visible }: { visible: boolean }) {
  const sentence = useUX((s) => s.content?.sentence ?? '');
  const [lineOne, lineTwo] = useMemo(() => splitInTwo(sentence), [sentence]);

  const bar = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const dimOne = useRef<HTMLSpanElement>(null);
  const dimTwo = useRef<HTMLSpanElement>(null);
  const fillOne = useRef<HTMLSpanElement>(null);
  const fillTwo = useRef<HTMLSpanElement>(null);
  /** Share of the sentence's width sitting on the first line — where the fill hands over
   *  from one line to the next. Measured in fit(), not per frame, which would thrash layout. */
  const handover = useRef(0.5);

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
      const w1 = dimOne.current?.offsetWidth ?? 0;
      const w2 = dimTwo.current?.offsetWidth ?? 0;
      if (w1 + w2 > 0) handover.current = w1 / (w1 + w2);
    };
    fit();
    // Re-measure once New Spirit has actually loaded — measuring against the fallback
    // font gives the wrong natural width and so the wrong scale.
    document.fonts?.ready.then(fit).catch(() => {});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [sentence]);

  // Only runs while the meter is actually on screen. It's hidden for the whole landing
  // and end state, and there's no sense writing a transform and a clip-path 60 times a
  // second at something nobody can see.
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = Math.min(1, Math.max(0, view.p));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      // Each line gets its own clip so the fill reads the way the line does: the first
      // line completes before the second starts. Sharing one clip across both would fill
      // them side by side instead. The handover point is where the text actually breaks,
      // so progress stays true to how much of the sentence has been covered.
      const h = handover.current;
      const pOne = h > 0 ? Math.min(1, p / h) : 1;
      const pTwo = h < 1 ? Math.max(0, (p - h) / (1 - h)) : 0;
      if (fillOne.current) fillOne.current.style.clipPath = `inset(0 ${(1 - pOne) * 100}% 0 0)`;
      if (fillTwo.current) fillTwo.current.style.clipPath = `inset(0 ${(1 - pTwo) * 100}% 0 0)`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    // Side padding clears the ‹ › controls and the Kai launcher in the bottom corners.
    <div
      aria-hidden
      // Mirrors the ‹ › controls' own box exactly — same bottom offset at each
      // breakpoint (they shift to bottom-8 from `sm`) and the same 40px height — so
      // items-center lands this on their vertical centre line. The side padding clears
      // the controls (which end 124px in once they move to left-8) and the Kai launcher.
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-30 flex h-10 items-center justify-center px-32 transition-opacity duration-500 ease-out sm:bottom-8 sm:px-36 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div ref={track} className="relative w-full">
        {/* Under 992px: the plain rule. */}
        <div className="h-px w-full bg-[#ff6666]/40 min-[992px]:hidden">
          <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-[#ffcf33]" />
        </div>

        {/* 992px and up: the sentence, filling in as you scroll. */}
        <div className="hidden h-[30px] min-[992px]:block">
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
            className="font-spirit absolute left-1/2 top-1/2 w-max whitespace-nowrap text-[13px] font-medium leading-[1.15] tracking-tight"
          >
            {/* Each line is its own positioning context, so its bright copy sits exactly
                over its dim one and can be clipped independently. w-max on both keeps the
                two rows sized to their own text rather than to the wider of the pair. */}
            <div className="relative block w-max">
              <span ref={dimOne} className="block text-[#ff6666]">
                {lineOne}
              </span>
              <span
                ref={fillOne}
                style={{ clipPath: 'inset(0 100% 0 0)' }}
                className="absolute inset-0 block text-[#ffcf33]"
              >
                {lineOne}
              </span>
            </div>
            <div className="relative block w-max">
              <span ref={dimTwo} className="block text-[#ff6666]">
                {lineTwo}
              </span>
              <span
                ref={fillTwo}
                style={{ clipPath: 'inset(0 100% 0 0)' }}
                className="absolute inset-0 block text-[#ffcf33]"
              >
                {lineTwo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
