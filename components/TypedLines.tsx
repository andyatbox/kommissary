'use client';

import { useEffect, useState } from 'react';

/** Per-character typing speed, and the faster rate it rewinds at. */
const TYPE_MS = 55;
const ERASE_MS = 22;
/** How long a finished sentence sits before it starts rewinding. */
const HOLD_MS = 1800;
/** Beat between one sentence clearing and the next starting. */
const GAP_MS = 350;
/** Small delay before the very first character, so it doesn't start mid-page-load. */
const START_MS = 500;

/**
 * The landing tagline: types a sentence out, holds it, rewinds it faster, then moves to
 * the next — looping through the list forever.
 *
 * Driven by a self-scheduling timeout rather than an interval, so each phase can run at
 * its own speed. Honours prefers-reduced-motion by showing the first line statically.
 */
export default function TypedLines({ lines, className = '' }: { lines: string[]; className?: string }) {
  const [text, setText] = useState('');

  // The list is joined into a single string and used as the effect's dependency, then
  // split back apart inside. A plain array prop would be a new identity every render and
  // would restart the animation constantly.
  const key = lines.filter(Boolean).join('\n');

  useEffect(() => {
    const items = key.split('\n').filter(Boolean);
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(items[0]);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let line = 0;
    let pos = 0;
    let phase: 'type' | 'hold' | 'erase' | 'gap' = 'type';

    const step = () => {
      const current = items[line % items.length];
      let delay: number;

      if (phase === 'type') {
        pos += 1;
        setText(current.slice(0, pos));
        if (pos >= current.length) {
          phase = 'hold';
          delay = HOLD_MS;
        } else {
          delay = TYPE_MS;
        }
      } else if (phase === 'hold') {
        phase = 'erase';
        delay = ERASE_MS;
      } else if (phase === 'erase') {
        pos -= 1;
        setText(current.slice(0, Math.max(0, pos)));
        if (pos <= 0) {
          phase = 'gap';
          delay = GAP_MS;
        } else {
          delay = ERASE_MS;
        }
      } else {
        line += 1;
        pos = 0;
        phase = 'type';
        delay = TYPE_MS;
      }

      timer = setTimeout(step, delay);
    };

    timer = setTimeout(step, START_MS);
    return () => clearTimeout(timer);
  }, [key]);

  if (!key) return null;

  return (
    <h3 className={`font-spirit text-center font-medium leading-snug text-[#ff6666] ${className}`}>
      {/* Every line at once for screen readers — announcing each keystroke would be noise. */}
      <span className="sr-only">{key.split('\n').join(' ')}</span>
      <span aria-hidden>
        {text}
        {/* Empty box with an explicit size, so the caret is a crisp bar rather than
            whatever a whitespace character happens to measure. */}
        <span className="caret-blink ml-1 inline-block h-[0.95em] w-[2px] translate-y-[0.1em] bg-[#ff6666]" />
      </span>
    </h3>
  );
}
