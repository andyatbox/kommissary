/**
 * Instagram media for @kommissary, read through the Instagram API with Instagram Login.
 *
 * A note on `media_url`: Instagram only returns the direct video file for reels whose
 * audio it can license outside the app — in practice roughly a third of them. For the
 * rest the field is simply absent, and there is no way to play them on our own site (the
 * official embed serves no video either, just a "Watch on Instagram" button). So every
 * reel carries a poster and a permalink, and `canPlayInline` says which of the two
 * treatments a card should use.
 */

import { getAccessToken } from './token';

const GRAPH = 'https://graph.instagram.com/v21.0';

/** How long fetched media is cached. Instagram's file URLs expire, so keep this short
 *  enough that a cached page never hands the browser a dead link. */
const REVALIDATE_SECONDS = 1800; // 30 minutes

export type Reel = {
  id: string;
  /** Direct link to the reel on Instagram. Always present. */
  permalink: string;
  /** Poster image. Always present. */
  poster: string;
  caption: string;
  timestamp: string;
  /**
   * True when Instagram gave us a playable file, so the card can play it in place.
   * False means the card must link out — see the note at the top of this file.
   */
  canPlayInline: boolean;
};

type RawMedia = {
  id: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
};

const FIELDS = 'id,media_type,media_product_type,media_url,thumbnail_url,permalink,caption,timestamp';

function toReel(m: RawMedia): Reel | null {
  const poster = m.thumbnail_url ?? m.media_url;
  if (!m.permalink || !poster) return null;
  return {
    id: m.id,
    permalink: m.permalink,
    poster,
    caption: m.caption ?? '',
    timestamp: m.timestamp ?? '',
    canPlayInline: Boolean(m.media_url),
  };
}

/**
 * The most recent reels, newest first. Returns an empty list on any failure — a missing
 * token or a bad response should leave a quiet gap in the page, never break the render.
 */
export async function getReels(limit = 24): Promise<Reel[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const url = `${GRAPH}/me/media?fields=${FIELDS}&limit=${Math.min(limit * 2, 100)}&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      console.error('Instagram media fetch failed:', res.status);
      return [];
    }
    const json = (await res.json()) as { data?: RawMedia[] };
    return (json.data ?? [])
      .filter((m) => m.media_product_type === 'REELS')
      .map(toReel)
      .filter((r): r is Reel => r !== null)
      .slice(0, limit);
  } catch (err) {
    console.error('Instagram media fetch failed:', err);
    return [];
  }
}

/** One media item by id — used to resolve a fresh file URL at play time. */
export async function getMediaUrl(id: string): Promise<string | null> {
  if (!/^\d+$/.test(id)) return null;
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH}/${id}?fields=media_url&access_token=${token}`, {
      // Deliberately short: these URLs expire, and this call exists to get a live one.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { media_url?: string };
    return json.media_url ?? null;
  } catch {
    return null;
  }
}

/** Look up reels by their Instagram permalink, for content that references a specific
 *  post (the Video Embed section). Keyed by the shortcode, so trailing slashes and
 *  query strings on an editor-pasted URL don't matter. */
export async function getReelsByCode(): Promise<Map<string, Reel>> {
  const reels = await getReels(100);
  const map = new Map<string, Reel>();
  for (const reel of reels) {
    const code = reel.permalink.match(/\/(?:reel|p|tv)\/([\w-]+)/)?.[1];
    if (code) map.set(code, reel);
  }
  return map;
}
