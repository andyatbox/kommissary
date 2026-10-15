/**
 * Whether the visitor is on the public site, kommissary.com.
 *
 * Everything that reaches the outside world on a visitor's behalf checks this first:
 * analytics, ad pixels and the lead forms. Anywhere else (localhost, the staging site, a
 * preview URL) is a test site, so testing never adds visits to Google's or Meta's reports
 * and never emails a test lead to the care team.
 *
 * Decided by the address in the browser, not by a build setting, on purpose: a staging
 * site can't be mistaken for the live one by however it happened to be built, and the
 * live site needs no flag that could be forgotten at launch (and quietly drop real leads).
 */
export const LIVE_HOSTS = ['kommissary.com', 'www.kommissary.com'];

/**
 * On the server: whether a request came to kommissary.com, by its Host header. Only Host:
 * X-Forwarded-Host is never trusted, since a visitor can send any value in it (and so
 * pose as the live site to skip the staging password).
 */
export function isLiveRequest(req: Request): boolean {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase();
  return LIVE_HOSTS.includes(host);
}

/** In the browser: true on kommissary.com. Always false while rendering on the server. */
export function isLiveSite(): boolean {
  return typeof window !== 'undefined' && LIVE_HOSTS.includes(window.location.hostname);
}

/**
 * Off the live site, the lead forms show their thank-you without sending. Add
 * ?livesubmit=1 to the page address to send for real anyway, for a deliberate end-to-end
 * test that answers reach the Google Form (they WILL be emailed to the care team).
 */
export function formsSendForReal(): boolean {
  if (isLiveSite()) return true;
  return new URLSearchParams(window.location.search).get('livesubmit') === '1';
}
