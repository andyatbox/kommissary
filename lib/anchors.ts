import type { PortableTextBlock } from '@portabletext/types';
import type { PageSection } from '@/components/sections/SectionRenderer';

/**
 * Collects the anchor annotations out of a page's rich text, so the jump-to menu can be
 * built automatically from whatever an editor has tagged — no separate menu to maintain.
 *
 * In Portable Text an annotation lives in a block's `markDefs`, and the text it covers is
 * whichever `children` spans carry that markDef's `_key` in their `marks`. So the menu
 * label falls back through: the anchor's own label → the text it was applied to → its id.
 */
export type PageAnchor = { id: string; label: string };

type Span = { text?: string; marks?: string[] };
type MarkDef = { _type?: string; _key?: string; id?: string; label?: string };
type Block = { _type?: string; markDefs?: MarkDef[]; children?: Span[] };

function collectFromBlocks(blocks: PortableTextBlock[] | undefined, out: PageAnchor[]) {
  for (const raw of blocks ?? []) {
    const block = raw as unknown as Block;
    if (block._type !== 'block' || !block.markDefs?.length) continue;

    for (const def of block.markDefs) {
      if (def._type !== 'anchor' || !def.id) continue;
      const markedText = (block.children ?? [])
        .filter((child) => def._key && child.marks?.includes(def._key))
        .map((child) => child.text ?? '')
        .join('')
        .trim();
      out.push({ id: def.id, label: def.label?.trim() || markedText || def.id });
    }
  }
}

/** Every anchor on the page, in document order, de-duplicated by id (first one wins). */
export function collectAnchors(sections: PageSection[]): PageAnchor[] {
  const found: PageAnchor[] = [];

  for (const section of sections) {
    if (section._type === 'bodyCopy') {
      collectFromBlocks(section.content, found);
    } else if (section._type === 'gridCopy') {
      collectFromBlocks(section.column1, found);
      collectFromBlocks(section.column2, found);
      collectFromBlocks(section.column3, found);
    }
  }

  const seen = new Set<string>();
  return found.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
