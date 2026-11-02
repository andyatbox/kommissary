'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fills the nav's scroll-progress rule on the ordinary scrolling pages, which scroll
 * natively. (These pages used to ease the mouse wheel to match Our Story's glide; dropped
 * in November 2026 for the browser's own scrolling.)
 */

/** Not here: pages that don't scroll, or fill the rule themselves (the homepage's 3D
 *  camera, the Our Impact slider, Our Story's SmoothScroll). */
const SKIP = new Set(['/', '/our-impact', '/our-story']);

export default function ScrollProgress() {
  const pathname = usePathname();
  const skip = SKIP.has(pathname);

  useEffect(() => {
    if (skip) return;
    const progress = document.getElementById('scroll-progress');
    if (!progress) return;
    const setProgress = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };

    setProgress();
    window.addEventListener('scroll', setProgress, { passive: true });
    window.addEventListener('resize', setProgress);
    return () => {
      window.removeEventListener('scroll', setProgress);
      window.removeEventListener('resize', setProgress);
      progress.style.transform = 'scaleX(0)';
    };
  }, [skip, pathname]);

  return null;
}
