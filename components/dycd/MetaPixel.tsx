'use client';

import { useEffect } from 'react';
import { isTestSite } from './analytics';

// Meta (Facebook) pixel for the Community Leaders (/dycd) page. Records a PageView on load; the
// form's submission records a Lead (see analytics.ts). Skipped off the live site (localhost, staging) so
// testing doesn't add visits to Meta's reports.
export const META_PIXEL_ID: string | null = '3319927018215853';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: unknown;
  loaded: boolean;
  version: string;
};

/** Meta's standard base code: queues calls until fbevents.js loads. */
function loadPixel() {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

export default function MetaPixel() {
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (isTestSite()) {
      console.info('[meta pixel] PageView (not sent off the live site)', META_PIXEL_ID);
      return;
    }
    loadPixel();
    const fbq = (window as unknown as { fbq: Fbq }).fbq;
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }, []);

  if (!META_PIXEL_ID) return null;

  // For visitors with JavaScript off. Set as raw HTML: when React renders <noscript>
  // with child elements in the browser it creates a real <img>, which loads and sends
  // a second PageView for every visitor.
  return (
    <noscript
      dangerouslySetInnerHTML={{
        __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
      }}
    />
  );
}
