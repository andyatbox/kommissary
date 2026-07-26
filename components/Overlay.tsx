'use client';

import { useEffect, useState } from 'react';
import { useUX } from '@/lib/store';
import Nav from './Nav';
import Modal from './Modal';

export default function Overlay() {
  const started = useUX((s) => s.started);
  const overviewActive = useUX((s) => s.overviewActive);

  // Wait until the models have finished cascading in before revealing the end screen.
  const [endReady, setEndReady] = useState(false);
  useEffect(() => {
    if (!overviewActive) {
      setEndReady(false);
      return;
    }
    const t = setTimeout(() => setEndReady(true), 1600);
    return () => clearTimeout(t);
  }, [overviewActive]);

  return (
    <>
      {/* Splash logo: center-contained, slides off to the left on first scroll. */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 flex items-center justify-center p-8 transition-all duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
          started
            ? '-translate-x-[130vw] opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kommissary-arched-logo.svg"
          alt="Kommissary"
          className="h-auto w-[min(72vw,640px)] max-w-full object-contain"
        />
      </div>

      {/* End screen: once the camera has pulled out and all models are shown, bring the
          arched logo back with a closing call to action. */}
      <div
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,6,102,0.85) 0%, rgba(0,6,102,0) 65%)',
        }}
        className={`pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center p-8 transition-opacity duration-1000 ${
          endReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kommissary-arched-logo.svg"
          alt="Kommissary"
          className="h-auto w-[min(72vw,640px)] max-w-full object-contain"
        />
        <h2 className="font-spirit max-w-2xl text-center text-xl font-medium leading-snug text-[#ff6666] min-[900px]:-mt-6 sm:text-2xl">
          This is only the beginning.
          <br />
          Use the menu to explore,
          <br />
          or let&rsquo;s{' '}
          <a
            href="/contact"
            className="pointer-events-auto underline decoration-2 underline-offset-4 transition-colors hover:text-[#ffcf33]"
          >
            connect
          </a>
          .
        </h2>
      </div>

      <Nav />
      <Modal />

      <div
        className={`pointer-events-none fixed bottom-10 left-1/2 z-10 -translate-x-1/2 text-center transition-opacity duration-700 ${
          started ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="font-spirit text-base font-medium tracking-normal text-[#ff6666]">
          Scroll to Explore
        </div>
        <svg
          className="mx-auto mt-3 h-8 w-8 animate-bounce text-[#ff6666]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v15" />
          <path d="M6 13l6 6 6-6" />
        </svg>
      </div>
    </>
  );
}
