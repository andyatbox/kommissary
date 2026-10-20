'use client';

import { useEffect } from 'react';
import { isLiveSite } from '@/lib/siteEnv';

/** Kommissary's Google Analytics 4 property, the same one the 1.0 site reports to. */
const GA_ID = 'G-FGFHGHS1KM';

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/**
 * Loads Google Analytics on kommissary.com only (lib/siteEnv.ts), so visits to localhost,
 * the staging site or a preview URL never reach the real reports. The Nutrition Box
 * pages' lead and click events go through the same `gtag` (components/<page>/analytics.ts).
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    if (!isLiveSite()) return;
    const w = window as GtagWindow;
    if (w.gtag) return;
    w.dataLayer = w.dataLayer || [];
    // gtag.js reads the `arguments` object off each entry, so this must stay a function.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', GA_ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }, []);
  return null;
}
