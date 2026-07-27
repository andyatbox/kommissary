'use client';

import { useRef } from 'react';
import { parseStatValue, type Stat } from '@/lib/story/stats';
import { useCountUp } from '@/lib/story/useCountUp';
import { useRevealOnce } from '@/lib/story/useRevealOnce';

/** Stagger between each counter's start, in ms — echoes the cascade the timeline's
 *  own model reveals use, so the two animated moments in the app feel of a piece. */
const STAGGER = 120;

/**
 * The closing section, after the scrolling timeline ends: five yearly totals in a
 * centred, wrapping row rather than a CSS grid. With five items at three per row, a
 * grid leaves the trailing two pinned to its left-hand tracks; a wrapping flexbox
 * centres each row — full or not — for free via justify-center. Three per row at
 * md and up, two per row below it, per each item's responsive width.
 *
 * The figures count up from zero once, the first time the section is scrolled into
 * reach (see useRevealOnce) — never again on subsequent scrolls past it.
 */
export default function MillionsServed({
  stats,
  heading = 'Millions Served',
  unit = 'Meals',
}: {
  stats: Stat[];
  heading?: string;
  unit?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const revealed = useRevealOnce(section);

  return (
    <section
      ref={section}
      className="border-t border-white/10 px-6 py-[14vh] text-center md:px-[8vw]"
    >
      <h1 className="text-4xl font-medium leading-[1.05] text-white sm:text-5xl md:text-6xl">
        {heading}
      </h1>

      <div className="mx-auto mt-[9vh] flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-12 md:gap-x-16">
        {stats.map((stat, i) => (
          <StatItem key={`${stat.year}-${i}`} stat={stat} unit={unit} revealed={revealed} delay={i * STAGGER} />
        ))}
      </div>
    </section>
  );
}

function StatItem({
  stat,
  unit,
  revealed,
  delay,
}: {
  stat: Stat;
  unit: string;
  revealed: boolean;
  delay: number;
}) {
  const parsed = parseStatValue(stat.value);
  const animated = useCountUp(parsed.value, revealed, delay);
  const display = `${animated.toFixed(parsed.decimals)}${parsed.suffix}${parsed.plus ? '+' : ''}`;

  return (
    <div className="w-[42%] sm:w-[30%] md:w-[27%]">
      <p className="font-spirit text-sm uppercase tracking-[0.22em] text-coral md:text-base">
        {stat.year}
      </p>
      {/* tabular-nums keeps digit widths fixed, so counting up doesn't jitter the
          figure's width frame to frame. */}
      <h2 className="mt-2 text-4xl font-medium tabular-nums text-white sm:text-5xl">
        {display}
      </h2>
      <h3 className="mt-1 text-sm uppercase tracking-[0.2em] text-white/70 md:text-base">
        {unit}
      </h3>
    </div>
  );
}
