import { NextResponse } from 'next/server';
import { getMediaUrl } from '@/lib/instagram/api';

/**
 * Resolves a reel's current video file and redirects to it.
 *
 * Instagram's file URLs are signed and expire, so baking one into a cached page would
 * eventually serve the browser a dead link. Pointing `<video src>` at this route instead
 * means the URL is looked up when playback actually starts, and is always live.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = await getMediaUrl(params.id);
  if (!url) {
    return NextResponse.json({ error: 'No playable video for this media.' }, { status: 404 });
  }
  return NextResponse.redirect(url, {
    headers: {
      // Let the browser reuse the resolved file briefly, but expire well inside
      // Instagram's own signature lifetime.
      'Cache-Control': 'public, max-age=300',
      // Safari checks CORS on the REDIRECT, not only on where it lands, so a
      // crossOrigin <video> pointed here fails on iOS without this.
      'Access-Control-Allow-Origin': '*',
    },
  });
}
