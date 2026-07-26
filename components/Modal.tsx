'use client';

import { useEffect, useState } from 'react';
import { PortableText } from 'next-sanity';
import type { PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { useUX, type PillButton } from '@/lib/store';

type OverlayContent = {
  label?: string;
  title?: string;
  body?: PortableTextBlock[];
  buttons?: PillButton[];
};

const ptComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-5 text-base leading-relaxed text-[#ff6666] first:mt-0 sm:text-lg">
        {children}
      </p>
    ),
  },
  // Tailwind's preflight removes list markers/indent, so restore them + the red color.
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-6 text-left text-base leading-relaxed text-[#ff6666] marker:text-[#ff6666] first:mt-0 sm:text-lg">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-6 text-left text-base leading-relaxed text-[#ff6666] marker:text-[#ff6666] first:mt-0 sm:text-lg">
        {children}
      </ol>
    ),
  },
  listItem: ({ children }) => <li className="pl-1">{children}</li>,
  marks: {
    link: ({ children, value }) => (
      <a
        href={(value as { href?: string })?.href ?? '#'}
        className="underline transition-colors hover:text-[#ffcf33]"
      >
        {children}
      </a>
    ),
  },
};

/** Normalize a Sanity path/url (e.g. "our-story" → "/our-story"), leaving full URLs alone. */
function toHref(url: string) {
  if (!url) return '#';
  if (/^https?:\/\//.test(url) || url.startsWith('/') || url.startsWith('#')) return url;
  return `/${url}`;
}

/**
 * Fullscreen content modal shown once a clicked pill's zoom-in finishes. It renders
 * that pill's title / body / buttons from Sanity. Closing clears the focus, which eases
 * the camera back out to the sentence path.
 */
export default function Modal() {
  const modalOpen = useUX((s) => s.modalOpen);
  const focus = useUX((s) => s.focus);
  const setModalOpen = useUX((s) => s.setModalOpen);
  const setFocus = useUX((s) => s.setFocus);

  // Retain the last pill's content so it doesn't vanish mid fade-out when focus clears.
  const [shown, setShown] = useState<OverlayContent | null>(null);
  useEffect(() => {
    if (focus) {
      setShown({
        label: focus.label,
        title: focus.title,
        body: focus.body,
        buttons: focus.buttons,
      });
    }
  }, [focus]);

  const close = () => {
    setModalOpen(false);
    setFocus(null);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const title = shown?.title ?? shown?.label;
  const buttons = shown?.buttons ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!modalOpen}
      aria-label={title ?? 'Content'}
      className={`fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#000666]/50 backdrop-blur-md transition-[opacity,visibility] duration-500 ${
        modalOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="fixed right-6 top-6 z-10 text-[#ff6666] transition-colors hover:text-[#ffcf33] sm:right-8 sm:top-8"
      >
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="flex min-h-full items-center justify-center p-8 sm:p-12">
        <div className="max-w-2xl text-center">
          {title && (
            <h2 className="font-spirit text-3xl font-medium text-white sm:text-4xl">{title}</h2>
          )}

          {shown?.body?.length ? (
            <div className="mt-6">
              <PortableText value={shown.body} components={ptComponents} />
            </div>
          ) : null}

          {buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {buttons.map((b, i) => (
                <a
                  key={i}
                  href={toHref(b.url)}
                  className="font-spirit rounded-full bg-[#ff6666] px-6 py-3 text-base font-medium text-[#000666] transition-colors hover:bg-[#ffcf33]"
                >
                  {b.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
