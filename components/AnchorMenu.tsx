'use client';

import type { PageAnchor } from '@/lib/anchors';

/**
 * Jump-to menu, built automatically from the anchors an editor has tagged in the page's
 * rich text. Renders nothing when a page has none, so it simply appears on the pages that
 * use anchors. Desktop only (768px and up) — on a phone a fixed block would sit on top of
 * the content it's meant to help you read.
 */
export default function AnchorMenu({ anchors }: { anchors: PageAnchor[] }) {
  if (!anchors.length) return null;

  const jumpTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return; // let the browser fall back to the plain #hash
    e.preventDefault();
    // scrollIntoView honours the target's scroll-margin-top, which PortableBody sets to
    // the fixed header's height — so the anchored text lands below the nav, not under it.
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Keep the URL shareable without the jump-cut a normal hash link would cause.
    history.replaceState(null, '', `#${id}`);
  };

  return (
    // w-fit so the block is only as wide as its longest label + padding (each item is a
    // block whose link is inline-block, so the widest link sets the width). max-w keeps a
    // very long label from stretching it across the screen.
    <nav
      aria-label="Jump to section"
      className="fixed bottom-6 left-6 z-40 hidden max-h-[60vh] w-fit max-w-[16rem] overflow-y-auto rounded-2xl bg-[#000666]/40 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md md:block"
    >
      <ul>
        {anchors.map((anchor, i) => {
          const last = i === anchors.length - 1;
          return (
            // pl clears the bullet; pb opens the gap the connecting line runs through.
            <li key={anchor.id} className={`relative pl-5 ${last ? '' : 'pb-3'}`}>
              {/* Connector first so the bullet paints over its top end. It runs from this
                  bullet down past the item's bottom edge to meet the next bullet. */}
              {!last && (
                <span
                  aria-hidden
                  className="absolute -bottom-[0.45em] left-[3px] top-[0.45em] w-0.5 bg-[#ff6666]"
                />
              )}
              <span
                aria-hidden
                className="absolute left-0 top-[0.45em] h-2 w-2 rounded-full bg-[#ff6666]"
              />
              <a
                href={`#${anchor.id}`}
                onClick={(e) => jumpTo(e, anchor.id)}
                className="font-spirit inline-block text-sm font-medium leading-snug text-[#ff6666] transition-colors hover:text-[#ffcf33]"
              >
                {anchor.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
