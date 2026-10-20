'use client';

import { useEffect, useRef } from 'react';
import { registerSlot } from '@/lib/story/stage';
import type { Moment } from '@/lib/story/timeline';

/**
 * One moment on the timeline.
 *
 * Layout, at md and up: the model occupies the window left of the rule (--line-x: 30%,
 * widened on desktops), centred on the ring, and the title + copy run in the rest.
 * Below md the split would leave the copy unreadably narrow, so the rule tucks against
 * the left edge (see --line-x) and the model stacks above the text.
 *
 * The model itself is drawn by the shared canvas behind the page — the div here is an
 * empty, transparent placeholder whose rect tells the canvas where to put it.
 */
export default function TimelineSection({ moment }: { moment: Moment }) {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    return registerSlot({ id: moment.id, el, spec: moment.model });
  }, [moment.id, moment.model]);

  return (
    // min-h is --media-h plus a small buffer, not a number of its own: the article
    // should be at least as tall as its model box, so the next article's model —
    // lifted by half *its* --media-h above its top — never reaches back up into this
    // one's content.
    <article className="relative md:min-h-[calc(var(--media-h)+4vh)]">
      {/* Model column. At md it is lifted by half the model's height so the model's
          centre lands on the ring.
          pointer-events-none here: this box shares its horizontal range with tl-col's
          padding (tl-col is a full-width box that only *looks* inset), and since
          tl-col comes later in the DOM it would otherwise win every click in that
          shared strip. Nothing in this box needs clicks, so nothing opts back in. */}
      <div className="pointer-events-none mb-10 pl-[var(--media-inset)] pr-6 md:absolute md:left-0 md:top-[var(--dot-y)] md:mb-0 md:w-[var(--line-x)] md:translate-y-[calc(var(--media-h)/-2)] md:pr-10">
        {/* An empty box the canvas measures — the model is fitted to this rect. */}
        <div className="h-[var(--media-h)]">
          <div ref={slot} role="img" aria-label={moment.model.alt} className="h-full w-full" />
        </div>
      </div>

      <div className="tl-col relative">
        {/* The ring on the rule. Centred on --line-x, and on the eyebrow's first line. */}
        <span
          aria-hidden="true"
          className="absolute left-[var(--line-x)] top-[var(--dot-y)] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-coral bg-navy"
        />

        <p className="font-spirit text-sm uppercase tracking-[0.22em] text-coral md:text-base">
          {moment.period}
        </p>

        <h2 className="mt-3 text-3xl font-medium leading-[1.05] text-white sm:text-4xl md:text-5xl lg:text-6xl">
          {moment.title}
        </h2>
        <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-white/80 md:mt-6 md:text-lg">
          {moment.body}
        </p>
      </div>
    </article>
  );
}
