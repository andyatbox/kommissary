import type { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/sanity/lib/image';

/**
 * Our Impact is an ordinary Page in Studio. Its route (app/(site)/our-impact) turns each
 * Body Copy section into one slide of the full-screen slider:
 *
 *   first Heading (h2)     → the slide's header
 *   first Subheading (h3)  → the line under it
 *   the rest of the text   → paragraphs, shown once the slide has snapped into place
 *   first image            → the full-screen picture behind it
 *
 * Other section types are skipped.
 */

export type ImpactSlide = {
  key: string;
  /** The heading's anchor id, if it has one, so /our-impact#id opens on this slide. */
  id?: string;
  header: string;
  subheader: string;
  paragraphs: PortableTextBlock[];
  image: {
    url: string;
    alt: string;
    /** The image's hotspot (0–1 from the top-left), kept in frame when cropped to fit. */
    focus: [number, number];
  } | null;
};

export type ImpactPageDoc = {
  title: string;
  description?: string;
  sections?: { _key: string; content?: RawBlock[] }[];
};

export const IMPACT_QUERY = `*[_type == "page" && slug.current == "our-impact"][0]{
  title,
  description,
  "sections": sections[_type == "bodyCopy"]{ _key, content }
}`;

type Span = { _type?: string; text?: string };
type MarkDef = { _type?: string; id?: string };
type RawBlock = {
  _type: string;
  _key: string;
  style?: string;
  children?: Span[];
  markDefs?: MarkDef[];
  asset?: { _ref?: string };
  hotspot?: { x: number; y: number };
  crop?: unknown;
  alt?: string;
};

const plain = (b: RawBlock) => (b.children ?? []).map((c) => c.text ?? '').join('').trim();

/** Wide enough to fill a large display. Sanity never enlarges, so smaller uploads come back as they are. */
const IMAGE_WIDTH = 2560;

export function slidesFromSections(sections: ImpactPageDoc['sections']): ImpactSlide[] {
  return (sections ?? []).map((section) => {
    const blocks = section.content ?? [];
    const header = blocks.find((b) => b._type === 'block' && b.style === 'h2');
    const subheader = blocks.find((b) => b._type === 'block' && b.style === 'h3');
    const image = blocks.find((b) => b._type === 'image' && b.asset?._ref);

    return {
      key: section._key,
      id: header?.markDefs?.find((m) => m._type === 'anchor' && m.id)?.id,
      header: header ? plain(header) : '',
      subheader: subheader ? plain(subheader) : '',
      paragraphs: blocks.filter(
        (b) => b._type === 'block' && b !== header && b !== subheader && plain(b)
      ) as unknown as PortableTextBlock[],
      image: image
        ? {
            url: urlFor(image).width(IMAGE_WIDTH).fit('max').quality(82).auto('format').url(),
            alt: image.alt ?? '',
            focus: [image.hotspot?.x ?? 0.5, image.hotspot?.y ?? 0.5],
          }
        : null,
    };
  });
}
