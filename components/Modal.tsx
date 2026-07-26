'use client';

import { useEffect } from 'react';
import { useUX } from '@/lib/store';

/**
 * Fullscreen content modal shown once a clicked pill's zoom-in finishes. Closing it
 * clears the focus, which eases the camera back out to the sentence path and brings
 * the header and pills back.
 */
export default function Modal() {
  const modalOpen = useUX((s) => s.modalOpen);
  const label = useUX((s) => s.focus?.label);
  const setModalOpen = useUX((s) => s.setModalOpen);
  const setFocus = useUX((s) => s.setFocus);

  const close = () => {
    setModalOpen(false);
    setFocus(null);
  };

  // Escape closes too.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!modalOpen}
      aria-label={label ?? 'Content'}
      // Kept mounted so it can fade in/out. overflow-y-auto + min-h-full on the inner
      // flex keeps content perfectly centered when it fits, and lets it scroll when it
      // overflows on small screens.
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
          <h2 className="font-spirit text-3xl font-medium text-white sm:text-4xl">
            {label ?? 'Lorem ipsum'}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#ff6666] sm:text-lg">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
            nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p className="mt-5 text-base leading-relaxed text-[#ff6666] sm:text-lg">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p className="mt-5 text-base leading-relaxed text-[#ff6666] sm:text-lg">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </div>
      </div>
    </div>
  );
}
