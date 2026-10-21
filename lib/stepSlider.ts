import type { UIEvent } from 'react';

/**
 * Helpers for the outreach pages' step-by-step forms (/bronx, /educator, /dycd), whose
 * steps sit side by side in a clipped track that slides one width per step.
 *
 * The track must never scroll: the slide on show is chosen by its transform alone. But a
 * clipped (overflow: hidden) box can still be scrolled by the browser, and phones do it to
 * keep a focused field in view: type a name, tap Back, and with the keyboard still up
 * iPhone Safari scrolls the track back to the name field. The transform then points one
 * way and the scroll the other, so every step after that shows the wrong slide, or half
 * of one (October 2026).
 */

/** onScroll for the track: undoes any scroll the browser makes, at once. */
export function keepTrackInPlace(e: UIEvent<HTMLElement>) {
  const track = e.currentTarget;
  if (track.scrollLeft || track.scrollTop) {
    track.scrollLeft = 0;
    track.scrollTop = 0;
  }
}

/** Before changing step: drops focus from a field in the slide being left, so the browser
 *  has no reason to scroll back to it (and the phone's keyboard closes with it). */
export function releaseFocusIn(container: HTMLElement | null) {
  const active = document.activeElement;
  if (active instanceof HTMLElement && container?.contains(active)) active.blur();
}
