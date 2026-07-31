'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/galleryImage';

/**
 * A horizontal image slider built on native CSS scroll-snap.
 *
 * Touch dragging, trackpad swiping, momentum and keyboard arrows all come from the
 * browser's own scroller — the < > controls and the bullets just call scrollTo, and
 * the active index is read back off scrollLeft. No drag library, and nothing to
 * re-implement badly.
 */
export default function GallerySlider({
  images,
  /** False until the section is near enough to bother fetching the imagery. */
  armed,
  labelledBy,
  /** Height utility for each slide. Defaults to the Our Story media box. */
  slideClassName = 'h-[var(--media-h)]',
  /** Extra classes for the controls row — e.g. padding to inset it from a full-bleed
   *  track so the bullets/arrows don't run to the screen edges. */
  controlsClassName = '',
  /**
   * 'cover' (default) fills the slide box and crops (the Our Story media box).
   * 'contain' shows the whole image: full height, natural (auto) width, centred — and
   * on mobile goes full width with padding (see `slidePadClassName`).
   */
  imageFit = 'cover',
  /** Padding on each slide — used by the full-bleed page slider to inset mobile images
   *  from the window edge so their rounded corners read. */
  slidePadClassName = '',
}: {
  images: GalleryImage[];
  armed: boolean;
  labelledBy?: string;
  slideClassName?: string;
  controlsClassName?: string;
  imageFit?: 'cover' | 'contain';
  slidePadClassName?: string;
}) {
  const contain = imageFit === 'contain';
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Read the index back off the scroller rather than tracking it ourselves, so a swipe
  // and a button press converge on the same source of truth.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!el.clientWidth) return;
        const i = Math.round(el.scrollLeft / el.clientWidth);
        setIndex(Math.max(0, Math.min(images.length - 1, i)));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [images.length]);

  const goTo = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(images.length - 1, i));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left: clamped * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    },
    [images.length]
  );

  if (!images.length) return null;

  return (
    // Fills whatever width the copy column gives it — no max-w cap — so it reads as
    // the same "media" real estate as the model view it swaps places with.
    <div className="w-full">
      <div
        ref={track}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-labelledby={labelledBy}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none ring-coral/60 focus-visible:ring-2"
      >
        {images.map((image, i) => (
          <div
            key={`${i}-${image.src}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
            // Fixed height rather than an aspect ratio: in 'cover' mode this is the same
            // box the 3D model occupies, so swapping doesn't resize the section; the LQIP
            // sits behind as a blur-up. In 'contain' mode the slide just centres the
            // image (which sets its own size).
            className={
              contain
                ? `${slideClassName} flex w-full shrink-0 snap-center items-center justify-center ${slidePadClassName}`
                : `${slideClassName} w-full shrink-0 snap-center overflow-hidden rounded-xl bg-white/5 bg-cover bg-center`
            }
            style={!contain && image.lqip ? { backgroundImage: `url(${image.lqip})` } : undefined}
          >
            {armed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.src}
                srcSet={image.srcSet}
                sizes={image.sizes}
                alt={image.alt}
                draggable={false}
                loading="lazy"
                style={!contain && image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
                // contain: full width on mobile (rounded, inset by the slide padding),
                // then full height / auto width / centred on desktop so the whole image
                // shows without cropping. cover: fill and crop.
                className={
                  contain
                    ? 'h-auto w-full select-none rounded-xl object-contain md:h-full md:w-auto'
                    : 'h-full w-full select-none object-cover'
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className={`mt-5 flex items-center justify-center gap-4 ${controlsClassName}`}>
        <Step label="Previous image" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <path d="M15 6l-6 6 6 6" />
        </Step>

        {/* Bullets sit inside a red pill; the row is centred. */}
        <ul className="flex items-center gap-2.5 rounded-full border border-coral px-4 py-2.5">
          {images.map((image, i) => (
            <li key={`${i}-${image.src}`}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`block h-2.5 w-2.5 rounded-full border border-coral transition-colors duration-200 hover:bg-gold hover:border-gold ${
                  i === index ? 'bg-coral' : 'bg-transparent'
                }`}
              />
            </li>
          ))}
        </ul>

        <Step
          label="Next image"
          disabled={index === images.length - 1}
          onClick={() => goTo(index + 1)}
        >
          <path d="M9 6l6 6-6 6" />
        </Step>
      </div>
    </div>
  );
}

function Step({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-coral text-coral transition-colors duration-200 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-25"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
