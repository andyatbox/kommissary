'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUX, view } from '@/lib/store';
import { uToProgress } from '@/lib/path';

/** Small gap so a pill you're centered on counts as neither "next" nor "previous". */
const EPS = 0.005;

/**
 * Bottom-left prev/next chevrons that ease the camera scroll to center the previous /
 * next pill button. `<` is disabled when there's no pill behind the current position
 * (i.e. before/at the first pill); `>` is disabled once the end-of-experience overview
 * is showing. From the last pill, `>` eases to the end shot.
 */
export default function HomeControls() {
  const dots = useUX((s) => s.dots);
  const ready = useUX((s) => s.ready);
  const travelStart = useUX((s) => s.travelStart);
  const travelEnd = useUX((s) => s.travelEnd);
  const overviewActive = useUX((s) => s.overviewActive);
  const modalOpen = useUX((s) => s.modalOpen);
  const setNavTarget = useUX((s) => s.setNavTarget);

  // Pill centers, as sorted scroll-progress values.
  const pillPs = useMemo(
    () =>
      dots
        .map((d) => uToProgress((d.uStart + d.uEnd) / 2, travelStart, travelEnd))
        .sort((a, b) => a - b),
    [dots, travelStart, travelEnd]
  );

  // Is there a pill behind the current scroll position? (drives the < disabled state).
  // Read live progress off `view` in a rAF loop; only re-render when the boolean flips.
  const [canPrev, setCanPrev] = useState(false);
  useEffect(() => {
    // Paused while the content modal covers the controls — they're not visible, and the
    // answer can't change without the scroll moving, which it can't while a modal is up.
    if (modalOpen) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const hasPrev = pillPs.some((p) => p < view.p - EPS);
      setCanPrev((was) => (was === hasPrev ? was : hasPrev));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pillPs, modalOpen]);

  const goPrev = () => {
    for (let i = pillPs.length - 1; i >= 0; i--) {
      if (pillPs[i] < view.p - EPS) {
        setNavTarget(pillPs[i]);
        return;
      }
    }
  };
  const goNext = () => {
    const next = pillPs.find((pp) => pp > view.p + EPS);
    setNavTarget(next ?? 1); // past the last pill → ease to the end shot
  };

  if (!ready || pillPs.length === 0) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-6 z-[55] flex items-center gap-3 transition-[opacity,visibility] duration-500 sm:bottom-8 sm:left-8 ${
        modalOpen ? 'invisible opacity-0' : 'visible opacity-100'
      }`}
    >
      <ChevronButton dir="prev" disabled={!canPrev} onClick={goPrev} />
      <ChevronButton dir="next" disabled={overviewActive} onClick={goNext} />
    </div>
  );
}

function ChevronButton({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous point' : 'Next point'}
      // Red round shape, dark-blue chevron.
      className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ff6666] text-[#000666] shadow-[0_8px_24px_rgba(255,102,102,0.35)] transition-[transform,opacity] duration-200 hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}
