import type { PageSection } from '@/components/sections/SectionRenderer';

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
  _type == "contactForm" => { heading, intro }
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

/** Resolve any server-side extras a section needs (currently: Vimeo poster images). */
export async function enrichSections(sections: PageSection[]): Promise<PageSection[]> {
  return Promise.all(
    sections.map(async (s) =>
      s._type === 'videoEmbed' && s.url.includes('vimeo.com')
        ? { ...s, poster: await vimeoPoster(s.url) }
        : s
    )
  );
}
