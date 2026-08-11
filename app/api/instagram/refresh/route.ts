import { NextResponse } from 'next/server';
import { getAccessToken, saveAccessToken, getExpiry } from '@/lib/instagram/token';

/**
 * Keeps the Instagram token alive.
 *
 * Instagram long-lived tokens last 60 days; refreshing one returns a replacement with a
 * fresh 60. Miss that window and the feed goes quiet until somebody re-runs the whole
 * connect flow — so a weekly cron (see vercel.json) refreshes it with a wide margin.
 * Refreshing early is harmless: it simply resets the clock.
 *
 * A GET with no cron header reports status without changing anything, so it doubles as a
 * health check you can open in a browser.
 */

/** Refresh once the token has less than this left. Weekly runs then give ~5 attempts
 *  before it would actually lapse, so a couple of failed runs can't sink it. */
const REFRESH_UNDER_DAYS = 30;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends this header automatically when CRON_SECRET is set.
  const invoked = req.headers.get('authorization') === `Bearer ${secret}`;

  const expiresAt = await getExpiry();
  const daysLeft = expiresAt
    ? Math.round((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;

  // Browser visit: report, don't touch anything.
  if (!invoked) {
    return NextResponse.json({
      status: 'ok',
      note: 'Health check only. The scheduled job performs the refresh.',
      storedExpiry: expiresAt ?? 'none yet (still using the env token)',
      daysLeft,
    });
  }

  if (daysLeft !== null && daysLeft > REFRESH_UNDER_DAYS) {
    return NextResponse.json({ refreshed: false, reason: 'still fresh', daysLeft });
  }

  try {
    const current = await getAccessToken();
    if (!current) {
      return NextResponse.json({ refreshed: false, error: 'no token available' }, { status: 500 });
    }

    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${current}`
    );
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: { message?: string };
    };

    if (!data.access_token || !data.expires_in) {
      const message = data.error?.message ?? 'no token returned';
      console.error('Instagram token refresh failed:', message);
      return NextResponse.json({ refreshed: false, error: message }, { status: 502 });
    }

    const stored = await saveAccessToken(data.access_token, data.expires_in);
    return NextResponse.json({
      refreshed: true,
      stored,
      validForDays: Math.round(data.expires_in / 86_400),
    });
  } catch (err) {
    console.error('Instagram token refresh failed:', err);
    return NextResponse.json({ refreshed: false, error: 'request failed' }, { status: 502 });
  }
}
