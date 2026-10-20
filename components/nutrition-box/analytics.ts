// Analytics events: Google Analytics, plus the Meta pixel's Lead event when a form is
// submitted. Off kommissary.com (localhost, staging) they're logged to the console instead
// of sent, so testing doesn't add data to the real reports. See lib/siteEnv.ts.

import { isLiveSite } from '@/lib/siteEnv';

type Gtag = (command: 'event', name: string, params: Record<string, string>) => void;
type Fbq = (command: 'track', name: string, params?: Record<string, string>) => void;

/** True on localhost and staging: anything that would report or send is skipped. */
export function isTestSite(): boolean {
  return !isLiveSite();
}

export function sendEvent(name: string, params: Record<string, string>) {
  if (isTestSite()) {
    console.info(`[analytics] ${name}`, params);
    return;
  }
  (window as unknown as { gtag?: Gtag }).gtag?.('event', name, params);
  if (name === 'generate_lead') {
    (window as unknown as { fbq?: Fbq }).fbq?.('track', 'Lead', params);
  }
}
