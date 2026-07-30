'use client';

import { useEffect, useRef } from 'react';

/**
 * Renders a raw HTML embed snippet from the CMS (iframe, widget, form, etc.).
 *
 * The markup is server-rendered via dangerouslySetInnerHTML so it's in the page
 * immediately — no dependency on client-side injection timing. A client effect then
 * handles the two things static HTML can't: re-creating any <script> tags so
 * script-based widgets actually run (browsers don't execute scripts set as HTML), and
 * giving a height-less iframe a sensible default (embed codes often rely on CSS
 * framework classes, e.g. Bootstrap's vh-100, that aren't loaded here).
 *
 * Trust note: this executes whatever HTML/JS an editor pastes, in the page's origin.
 * It's an editor-only, authenticated field (like every CMS "embed code" block), so the
 * trust boundary is the Studio — only paste snippets from sources you trust.
 */
export default function HtmlEmbed({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Re-create scripts so they actually run.
    for (const old of Array.from(el.querySelectorAll('script'))) {
      const s = document.createElement('script');
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    }

    // Default size for iframes whose snippet sets none (a height-less iframe collapses
    // to ~150px). Leaves iframes that set their own height/width untouched.
    for (const iframe of Array.from(el.querySelectorAll('iframe'))) {
      const style = iframe.getAttribute('style') ?? '';
      if (!iframe.getAttribute('height') && !/(?:^|;)\s*height\s*:/i.test(style)) {
        iframe.style.height = '80vh';
      }
      if (!iframe.getAttribute('width') && !/(?:^|;)\s*width\s*:/i.test(style)) {
        iframe.style.width = '100%';
      }
    }
  }, [code]);

  if (!code) return null;
  return (
    <div
      ref={ref}
      // Block display avoids the inline-image descender gap; max-w-full keeps a wide
      // embed from overflowing the column. Explicit author sizes are respected.
      className="[&_iframe]:block [&_iframe]:max-w-full"
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
