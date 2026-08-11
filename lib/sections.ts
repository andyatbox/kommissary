import type { PageSection } from '@/components/sections/SectionRenderer';
import { getReels, getReelsByCode } from '@/lib/instagram/api';

/**
 * Shared GROQ projection + server enrichment for the page-builder `sections` array,
 * used by both Pages ([slug]) and Weekly Posts (/weekly/[slug]) so they render the
 * exact same section types identically.
 */
export const SECTIONS_PROJECTION = `sections[]{
  _key,
  _type,
  _type == "bodyCopy" => { content },
  _type == "videoEmbed" => { url, caption },
  _type == "imageSlider" => {
    "images": images[]{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip }
  },
  _type == "gridCopy" => { columns, column1, column2, column3, topDivider, bottomDivider },
  _type == "htmlEmbed" => { code },
  _type == "contactForm" => { heading, intro },
  _type == "instagramReels" => { count }
}`;

/** Vimeo has no thumbnail-by-URL convention (unlike YouTube), so fetch its poster via
 *  oEmbed server-side and cache it for a day. Returns undefined on any failure. */
async function vimeoPoster(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}

/** Shortcode out of an Instagram post/reel URL, or null if it isn't one. */
function instagramCode(url: string): string | null {
  if (!/(^|\.)instagram\.com/.test(url)) return null;
  return url.match(/\/(?:reel|p|tv)\/([\w-]+)/)?.[1] ?? null;
}

/**
 * Resolve the server-side extras a section needs: Vimeo poster images, the Instagram
 * reels feed, and — for a Video Embed pointing at one of our own reels — that reel's
 * data, so it gets the same play / link-out treatment as the feed instead of Instagram's
 * own embed (which can't play video inline at all).
 */
export async function enrichSections(sections: PageSection[]): Promise<PageSection[]> {
  // Only look up the reel index if a Video Embed actually points at Instagram.
  const needsIgIndex = sections.some(
    (s) => s._type === 'videoEmbed' && instagramCode(s.url) !== null
  );
  const byCode = needsIgIndex ? await getReelsByCode() : null;

  return Promise.all(
    sections.map(async (s) => {
      if (s._type === 'instagramReels') {
        return { ...s, reels: await getReels(s.count ?? 12) };
      }
      if (s._type === 'videoEmbed') {
        if (s.url.includes('vimeo.com')) return { ...s, poster: await vimeoPoster(s.url) };
        const code = instagramCode(s.url);
        // Falls through to Instagram's iframe embed when the post isn't one of ours.
        if (code && byCode?.has(code)) return { ...s, reel: byCode.get(code) };
      }
      return s;
    })
  );
}
