'use client';

import { useLayoutEffect, type RefObject } from 'react';

// Where the educator's figure sits inside the 902x1308 illustration frame: the top of
// her hair and the bottom of her shoes, as fractions of the frame's height.
const HEAD_TOP = 133 / 1308;
const SHOES_BOTTOM = 1277 / 1308;

/** Gap between her shoes and the fold. */
const SHOES_TO_FOLD = 60;

/**
 * On landscape screens, sizes and places the illustration's column so the top of her
 * head sits at the middle of the headline's second line and her shoes end SHOES_TO_FOLD
 * above the fold (or the hero's bottom, if that's higher). The headline wraps
 * differently at every width, so this is measured rather than set in CSS. Portrait
 * screens keep the stylesheet layout.
 */
export function useIllustrationFit(
  section: RefObject<HTMLElement>,
  headline: RefObject<HTMLElement>,
  column: RefObject<HTMLElement>,
  deps: unknown[],
) {
  useLayoutEffect(() => {
    const sectionEl = section.current;
    const h1 = headline.current;
    const col = column.current;
    const grid = col?.parentElement;
    if (!sectionEl || !h1 || !col || !grid) return;

    const fit = () => {
      col.style.marginTop = '';
      col.style.height = '';
      if (!window.matchMedia('(orientation: landscape)').matches) return;

      // All positions relative to the hero's top, so scrolling doesn't matter.
      const top = sectionEl.getBoundingClientRect().top;
      const range = document.createRange();
      range.selectNodeContents(h1);
      const lines: DOMRect[] = [];
      for (const rect of Array.from(range.getClientRects())) {
        if (!lines.some((l) => Math.abs(l.top - rect.top) < 4)) lines.push(rect);
      }
      lines.sort((a, b) => a.top - b.top);
      const line = lines[1] ?? lines[0];
      if (!line) return;

      const headY = (line.top + line.bottom) / 2 - top;
      // The hero starts below 2.0's header, whose height changes with the screen size, so
      // its offset is measured: the hero's distance from the top of the page.
      const heroPageTop = top + window.scrollY;
      const foldY = Math.min(sectionEl.offsetHeight, window.innerHeight - heroPageTop);
      const shoesY = foldY - SHOES_TO_FOLD;
      const height = (shoesY - headY) / (SHOES_BOTTOM - HEAD_TOP);
      if (height <= 0) return;
      const illoTop = headY - HEAD_TOP * height;
      const gridTop = grid.getBoundingClientRect().top - top;

      col.style.marginTop = `${illoTop - gridTop}px`;
      col.style.height = `${height}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(sectionEl);
    observer.observe(h1);
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
