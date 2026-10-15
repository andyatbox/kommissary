/**
 * Whether this build is the public, production site.
 *
 * Off under `next dev`, and in any build made with NEXT_PUBLIC_SITE_ENV=staging (the
 * staging deploy script sets it, see scripts/deploy-staging.sh). Everything that reaches
 * the outside world on a visitor's behalf checks this first: analytics, ad pixels and the
 * lead forms. So testing on localhost or staging never adds visits to Google's or Meta's
 * reports, and never emails a test lead to the care team.
 *
 * A production build with nothing set counts as LIVE, deliberately. Defaulting the other
 * way, a flag forgotten at launch would silently drop real leads. This way round, the
 * worst a forgotten flag on staging can do is send a test lead, which someone will see.
 */
export const IS_LIVE_SITE =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SITE_ENV !== 'staging';

/**
 * Off the live site, the lead forms show their thank-you without sending anything. Add
 * ?livesubmit=1 to the page address to send for real anyway, for a deliberate end-to-end
 * test that the answers reach the Google Form (they will be emailed to the care team).
 */
export function formsSendForReal(): boolean {
  if (IS_LIVE_SITE) return true;
  return new URLSearchParams(window.location.search).get('livesubmit') === '1';
}
