'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import GallerySlider from './GallerySlider';
import { registerSlot } from '@/lib/story/stage';
import { useInBand } from '@/lib/story/useInBand';
import type { Moment } from '@/lib/story/timeline';

/** Shared easing for the trigger's entrance and the story/gallery swap. */
const EASE = 'ease-[cubic-bezier(0.7,0,0.2,1)]';

/**
 * Takes a subtree out of the tab order and the accessibility tree while it is the
 * hidden half of the story/gallery swap. `inert` rather than `aria-hidden` because the
 * gallery contains real buttons: aria-hiding a focusable element leaves it tabbable
 * but unannounced, which is worse than either state on its own.
 */
function useInert(ref: RefObject<HTMLElement>, inert: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inert) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }, [ref, inert]);
}

/**
 * One moment on the timeline.
 *
 * Layout, at md and up: the model occupies the left 30% of the window centred on the
 * ring, the ring sits on the rule at 30%, and the title + copy run in the remaining
 * 70%. Below md the split would leave the copy unreadably narrow, so the rule tucks
 * against the left edge (see --line-x) and the model stacks above the text.
 *
 * The model itself is drawn by the shared canvas behind the page — the div here is an
 * empty, transparent placeholder whose rect tells the canvas where to put it.
 */
export default function TimelineSection({ moment }: { moment: Moment }) {
  const slot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const prose = useRef<HTMLDivElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  const inBand = useInBand(ring);
  const hasGallery = moment.gallery.length > 0;

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    return registerSlot({ id: moment.id, el, spec: moment.model });
  }, [moment.id, moment.model]);

  // Fetch the imagery once the section first reaches the band, and keep it — scrolling
  // past and back should not tear the <img> elements down and rebuild them.
  useEffect(() => {
    if (inBand) setArmed(true);
  }, [inBand]);

  // Scrolling a section out of the reading band puts it back to its story.
  useEffect(() => {
    if (!inBand) setOpen(false);
  }, [inBand]);

  useInert(prose, open);
  useInert(gallery, !open);

  // Escape backs out of the gallery, matching the nav's behaviour.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const titleId = `${moment.id}-title`;
  const galleryId = `${moment.id}-gallery`;

  return (
    // min-h is --media-h plus a small buffer, not a number of its own: when this
    // section's gallery is open (or, on a section with no gallery, when the model
    // alone sets the pace), the article should already be at least that tall by
    // itself, so the next article's own model box — lifted by half *its* --media-h
    // above its top — never reaches back up into this one's content.
    <article className="relative md:min-h-[calc(var(--media-h)+4vh)]">
      {/* Model column. At md it is lifted by half the model's height so the model's
          centre lands on the ring.
          pointer-events-none here: this box shares its horizontal range with tl-col's
          padding (tl-col is a full-width box that only *looks* inset), and since
          tl-col comes later in the DOM it would otherwise win every click in that
          shared strip. Nothing in this box needs clicks, so nothing opts back in. */}
      <div className="pointer-events-none mb-10 pl-[var(--gallery-inset)] pr-6 md:absolute md:left-0 md:top-[var(--dot-y)] md:mb-0 md:w-[30%] md:translate-y-[calc(var(--media-h)/-2)] md:pr-10">
        {/* An empty box the canvas measures — the model is fitted to this rect. */}
        <div className="h-[var(--media-h)]">
          <div ref={slot} role="img" aria-label={moment.model.alt} className="h-full w-full" />
        </div>
      </div>

      {/* pointer-events-none for the same reason as the model column above: this box
          is full-width (its 30% inset is padding, not a boundary), so without this its
          empty left strip would sit over — and steal clicks from — the model column of
          whichever section's model lands underneath it. Real content opts back in below. */}
      <div className="tl-col relative pointer-events-none">
        {/* The ring on the rule. Centred on --line-x, and on the eyebrow's first line. */}
        <span
          ref={ring}
          aria-hidden="true"
          className="absolute left-[var(--line-x)] top-[var(--dot-y)] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-coral bg-navy"
        />

        {/* The period stays put across the open/close swap below — it's the timeline's
            anchor, not story copy. */}
        <p className="font-spirit text-sm uppercase tracking-[0.22em] text-coral md:text-base">
          {moment.period}
        </p>

        {hasGallery && (
          // Positioned exactly like the ring above — same top-[var(--dot-y)] plus
          // -translate-y-1/2 — rather than flexed alongside the period text. The
          // button's height is dominated by its icon, the period's by its line-height;
          // aligning their boxes (however carefully) doesn't align their visual
          // centres. Pinning both to the same coordinate does.
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={galleryId}
            tabIndex={inBand ? 0 : -1}
            className={`absolute right-[var(--tl-pr)] top-[var(--dot-y)] flex -translate-y-1/2 items-center gap-2 text-coral transition-[transform,opacity] duration-700 ${EASE} hover:text-gold focus-visible:text-gold motion-reduce:transition-none ${
              inBand
                ? 'pointer-events-auto translate-x-0 opacity-100'
                : 'pointer-events-none translate-x-[calc(100%_+_var(--tl-pr))] opacity-0'
            }`}
          >
            {open ? <CloseIcon /> : <PhotographIcon />}
            <span className="font-spirit text-sm uppercase tracking-[0.22em]">
              {open ? 'Close' : 'Gallery'}
            </span>
          </button>
        )}

        {/* Both states share one grid cell, so the section is as tall as the taller of
            them in either state and swapping causes no layout jump. */}
        <div className="pointer-events-auto mt-3 grid">
          <div
            ref={prose}
            className={`col-start-1 row-start-1 transition-[transform,opacity] duration-500 ${EASE} motion-reduce:transition-none ${
              open ? 'pointer-events-none -translate-x-8 opacity-0' : 'translate-x-0 opacity-100'
            }`}
          >
            <h2
              id={titleId}
              className="text-3xl font-medium leading-[1.05] text-white sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {moment.title}
            </h2>
            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-white/80 md:mt-6 md:text-lg">
              {moment.body}
            </p>
          </div>

          {hasGallery && (
            <div
              ref={gallery}
              id={galleryId}
              className={`col-start-1 row-start-1 transition-[transform,opacity] duration-500 ${EASE} motion-reduce:transition-none ${
                open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0'
              }`}
            >
              <GallerySlider images={moment.gallery} armed={armed} labelledBy={titleId} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function PhotographIcon() {
  return (
    <svg
      className="h-6 w-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M3 16l4.5-4.5 3.5 3.5 3-3L21 17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-6 w-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
