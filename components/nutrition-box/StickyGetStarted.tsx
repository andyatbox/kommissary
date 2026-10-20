'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOCUS_FORM_EVENT, GET_STARTED } from './content';
import { specials } from './fonts';
import { useLang } from './i18n';
import styles from './StickyGetStarted.module.css';

// "Get Started" fixed in the bottom-right corner. Hidden while the eligibility form in
// the hero is on screen; slides in once it has scrolled out of view. Clicking it
// scrolls back up to the form.
//
// Portaled to <body>: the page scrolls inside ScrollSmoother's transformed wrapper,
// where position: fixed doesn't hold.

// Height of the 1.0 site's fixed nav.
const NAV_PX = 120;

// The font's variable class is on the button itself, since it renders outside <main>.
const BUTTON_BASE = `${specials.variable} cursor-pointer rounded-full border-0 px-5 py-2 font-specials text-2xl font-normal leading-tight shadow-[0_6px_24px_rgba(0,0,0,0.3)] transition-colors hover:bg-white hover:text-[#000066] md:px-7 md:text-3xl wide:px-9 wide:py-3 wide:text-4xl`;
const BUTTON = `${BUTTON_BASE} bg-canary text-[#000066]`;
// Over light backgrounds (the yellow FAQ and footer).
const BUTTON_ON_LIGHT = `${BUTTON_BASE} bg-[#000066] text-canary`;

/** Whether the page behind a point is light, going by the first solid background there. */
function isLightBehind(x: number, y: number, skip: Element): boolean {
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip.contains(el)) continue;
    let node: Element | null = el;
    while (node) {
      const match = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
      const [r, g, b, a = 1] = match ? match.map(Number) : [0, 0, 0, 0];
      if (a >= 0.5) return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
      node = node.parentElement;
    }
  }
  return false;
}

export default function StickyGetStarted() {
  const lang = useLang();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [onLight, setOnLight] = useState(false);

  useEffect(() => setMounted(true), []);

  // Show once no part of the form is on screen. The top strip behind 2.0's header (the
  // logo and nav, NAV_PX) doesn't count as on screen.
  useEffect(() => {
    if (!mounted) return;
    const form = document.querySelector('[data-section="eligibility-form"]');
    if (!form) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: `-${NAV_PX}px 0px 0px 0px`,
    });
    observer.observe(form);
    return () => observer.disconnect();
  }, [mounted]);

  // While showing, switch to the navy version over light sections so it stays visible.
  // Checked on a short interval rather than on every scroll event, which is cheaper and
  // still catches momentum scrolling after the last event.
  useEffect(() => {
    if (!visible) return;
    const check = () => {
      const el = buttonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setOnLight(isLightBehind(rect.left + rect.width / 2, rect.top + rect.height / 2, el));
    };
    check();
    const timer = setInterval(check, 150);
    return () => clearInterval(timer);
  }, [visible]);

  if (!mounted) return null;

  return createPortal(
    <button
      ref={buttonRef}
      type="button"
      data-track="get-started-sticky"
      aria-hidden={!visible || undefined}
      tabIndex={visible ? undefined : -1}
      className={`${onLight ? BUTTON_ON_LIGHT : BUTTON} ${styles.sticky} ${visible ? styles.shown : ''}`}
      onClick={() => window.dispatchEvent(new Event(FOCUS_FORM_EVENT))}
    >
      {GET_STARTED[lang]}
    </button>,
    document.body,
  );
}
