'use client';

import { useEffect, useRef } from 'react';

/**
 * Renders a raw HTML embed snippet from the CMS (iframe, widget, form, etc.).
 *
 * Client-side and imperative rather than dangerouslySetInnerHTML, because scripts
 * inserted via innerHTML don't execute — many widget embeds are a <script> that
 * builds the widget, so we re-create each <script> node so the browser runs it.
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
    el.innerHTML = code;

    // Re-inject scripts so they actually run.
    for (const old of Array.from(el.querySelectorAll('script'))) {
      const s = document.createElement('script');
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    }

    return () => {
      el.innerHTML = '';
    };
  }, [code]);

  if (!code) return null;
  // Make embedded iframes responsive by default; other markup renders as authored.
  return <div ref={ref} className="[&_iframe]:max-w-full [&_iframe]:rounded-xl" />;
}
