'use client';

import { useEffect } from 'react';
import { sendEvent } from './analytics';

// Sends a Google Analytics event for every click on the page, nav and footer included:
//
//   page_click
//     click_id       stable name from data-track, e.g. "callback-sticky" (same in
//                    English and Spanish), else "" (use click_text)
//     click_element  link | button | faq | other
//     click_text     the visible text or aria-label, trimmed to 100 characters
//     click_url      the link's address, for links
//     click_section  nearest data-section (hero, features, lets-connect, qualifications,
//                    callback-form, language-toggle), or nav / footer
//     faq_action     open | close, for FAQ questions
//     page_language  en | es
//
// What visitors type into the form is never sent, only which buttons they click.
// CallbackForm also sends generate_lead (form_name dycd_callback, page_language)
// when the form is submitted.
// On localhost the event is logged to the console instead of sent, so previews don't
// add test clicks to the real data.

const INTERACTIVE = 'a, button, summary, input, select, textarea, label, [role="button"]';

function textOf(el: Element): string {
  const text = el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.textContent || '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 100);
}

function sectionOf(el: Element): string {
  const marked = el.closest<HTMLElement>('[data-section]');
  if (marked?.dataset.section) return marked.dataset.section;
  if (el.closest('nav[aria-label="Main"]')) return 'nav';
  return 'page';
}

function describe(target: Element): Record<string, string> {
  const interactive = target.closest(INTERACTIVE);
  // An element's own data-track (the modal's backdrop is the <dialog> itself) only
  // counts when the click landed on it directly, not on something inside it.
  const el = interactive ?? target;
  const trackId = (interactive as HTMLElement | null)?.dataset.track ?? (target as HTMLElement).dataset?.track ?? '';

  const params: Record<string, string> = {
    click_id: trackId,
    click_text: textOf(el),
    click_section: sectionOf(el),
    page_language: document.documentElement.lang || 'en',
  };

  if (el instanceof HTMLAnchorElement) {
    params.click_element = 'link';
    params.click_url = el.href;
  } else if (el.tagName === 'SUMMARY') {
    params.click_element = 'faq';
    // The click hasn't toggled <details> yet, so "open" now means it's closing.
    params.faq_action = (el.parentElement as HTMLDetailsElement | null)?.open ? 'close' : 'open';
  } else if (interactive) {
    params.click_element = 'button';
  } else {
    params.click_element = 'other';
    params.click_text = textOf(target).slice(0, 60);
  }
  return params;
}

export default function ClickTracking() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element) sendEvent('page_click', describe(e.target));
    };
    // Capture phase, so clicks are seen even if something stops them bubbling.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
