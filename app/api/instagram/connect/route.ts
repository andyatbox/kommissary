import { NextResponse } from 'next/server';
import { IG_APP_ID, IG_REDIRECT_URI, IG_SCOPE } from '@/lib/instagram/config';

/**
 * Step 1 of connecting the Instagram account: bounce the visitor to Instagram's own
 * permission screen.
 *
 * This exists so the account holder can authorise us from THEIR browser, logged into
 * THEIR Instagram — no shared password, and no Meta developer or Business access needed
 * on their side. Send them this URL; Instagram sends them back to /callback.
 */
export function GET() {
  if (!IG_APP_ID) {
    return NextResponse.json(
      { error: 'INSTAGRAM_APP_ID is not set on the server.' },
      { status: 500 }
    );
  }

  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', IG_APP_ID);
  url.searchParams.set('redirect_uri', IG_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', IG_SCOPE);

  return NextResponse.redirect(url.toString());
}
