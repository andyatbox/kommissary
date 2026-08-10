/**
 * Instagram API credentials and endpoints.
 *
 * IMPORTANT: these are the **Instagram** app ID and secret, found in the App Dashboard
 * under Instagram → API setup with Instagram Login → "Set up Instagram business login".
 * They are NOT the Facebook App ID/Secret on the Basic settings page — Instagram Business
 * Login rejects those.
 *
 * All of these are server-only (no NEXT_PUBLIC_ prefix), so the secret never reaches the
 * browser bundle.
 */
export const IG_APP_ID = process.env.INSTAGRAM_APP_ID ?? '';
export const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET ?? '';

/** Must match a "Valid OAuth Redirect URI" in the app dashboard EXACTLY (including https
 *  and no trailing slash), or Instagram refuses the handshake. */
export const IG_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI ?? 'https://kommissary-omega.vercel.app/api/instagram/callback';

/** Read-only access to the account's profile and media — all a public feed needs. */
export const IG_SCOPE = 'instagram_business_basic';
