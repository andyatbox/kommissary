'use client';

import { useEffect, useState } from 'react';
import { PortableText } from 'next-sanity';
import type { PortableTextComponents } from '@portabletext/react';
import { useUX } from '@/lib/store';
import Modal from './Modal';
import HomeControls from './HomeControls';
import HomeProgress from './HomeProgress';
import HomeWeekly from './HomeWeekly';
import TypedLines from './TypedLines';
import type { TeaserPost } from './weekly/WeeklyGrid';

/** Shared style for the inline links in the end-state call to action. */
const END_LINK =
  'pointer-events-auto underline decoration-2 underline-offset-4 transition-colors hover:text-[#ffcf33]';

/**
 * Bottom edge of the band that sits between the nav links and the arched logo — used by
 * both the landing tagline and the end-state call to action. The logo is centred and
 * sized `min(72vw,640px)` wide, and its SVG is 0.2523 as tall as it is wide, so its top
 * edge is half that height above the midline; the extra 20px keeps copy off the arch's
 * peak, which is its highest point and sits dead centre.
 */
const BAND_BOTTOM = 'calc(50% + min(72vw, 640px) * 0.126155 + 20px)';

/**
 * Renders the Sanity end-screen copy INSIDE the heading, so a paragraph block emits its
 * children rather than its own <p> — the styling belongs to the h3 around it.
 */
const END_CTA_COMPONENTS: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    link: ({ children, value }) => {
      const href = (value as { href?: string })?.href ?? '#';
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={END_LINK}
        >
          {children}
        </a>
      );
    },
  },
};

export default function Overlay({ latestWeekly }: { latestWeekly: TeaserPost[] }) {
  const started = useUX((s) => s.started);
  const overviewActive = useUX((s) => s.overviewActive);
  const typedLines = useUX((s) => s.content?.typedLines) ?? [];
  // The path has been measured and the words placed — scrolling does something now.
  const ready = useUX((s) => s.ready);
  const endCta = useUX((s) => s.content?.endCta);

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

  // The Weekly strip and the progress meter share the bottom slot: the strip holds it on
  // the landing and again at the end, the meter only while you're travelling between the
  // two. The meter waits out the strip's fade before appearing, so they never cross over.
  const showWeekly = !started || endReady;
  const [showProgress, setShowProgress] = useState(false);
  useEffect(() => {
    if (showWeekly) {
      setShowProgress(false);
      return;
    }
    const t = setTimeout(() => setShowProgress(true), 750);
    return () => clearTimeout(t);
  }, [showWeekly]);

  return (
    <>
      {/* Splash logo: center-contained, slides off to the left on first scroll. The
          scroll hint is nested directly under the logo, tucked up into the arch. */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center p-8 transition-all duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)] ${
          started
            ? 'invisible -translate-x-[130vw] opacity-0'
            : 'visible translate-x-0 opacity-100'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kommissary-arched-logo.svg"
          alt="Kommissary"
          className="h-auto w-[min(72vw,640px)] max-w-full object-contain"
        />
        {/* Tucked into the arch, but far less on a phone, where the logo is small enough
            that the desktop offset put the hint on top of the wordmark. Held back until
            the scene is ready, so it never invites a scroll that does nothing. */}
        <div
          className={`-mt-4 text-center transition-opacity duration-500 sm:-mt-12 md:-mt-16 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="font-spirit text-base font-medium tracking-normal text-[#ff6666]">
            Scroll to Explore
          </div>
          <svg
            className="mx-auto mt-2 h-8 w-8 animate-bounce text-[#ff6666]"
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
      </div>

      {/* End screen: once the camera has pulled out and all models are shown, bring the
          arched logo back with a closing call to action. */}
      <div
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,6,102,0.85) 0%, rgba(0,6,102,0) 65%)',
        }}
        className={`pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center p-8 transition-opacity duration-1000 ${
          endReady ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kommissary-arched-logo.svg"
          alt="Kommissary"
          className="h-auto w-[min(72vw,640px)] max-w-full object-contain"
        />
      </div>

      {/* Landing tagline, in the band between the nav links and the arched logo — the
          same slot the end-state call to action uses (the two never show at once). */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-[100px] z-40 flex items-center justify-center px-4 transition-opacity duration-700 ease-out md:top-[112px] ${
          started ? 'invisible opacity-0' : 'visible opacity-100'
        }`}
        style={{ bottom: BAND_BOTTOM }}
      >
        <TypedLines lines={typedLines} className="max-w-2xl text-lg sm:text-xl" />
      </div>

      {/* End-state call to action, in the band between the header and the arched logo. */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-[100px] z-40 flex items-center justify-center px-4 transition-[opacity,transform] duration-700 ease-out md:top-[112px] ${
          // `invisible` when closed, not merely opacity-0: the links inside set
          // pointer-events-auto on THEMSELVES, which overrides pointer-events-none on
          // this container — so a faded-out call to action still caught clicks.
          // visibility hides descendants outright, whatever they ask for.
          endReady
            ? 'visible translate-y-0 opacity-100'
            : 'invisible translate-y-6 opacity-0'
        }`}
        style={{ bottom: BAND_BOTTOM }}
      >
        <h3 className="font-spirit max-w-xl text-center text-lg font-medium leading-snug text-[#ff6666] sm:text-xl">
          {endCta?.length ? (
            <PortableText value={endCta} components={END_CTA_COMPONENTS} />
          ) : (
            // Built-in copy until someone sets their own in Sanity.
            <>
              Hear <a href="/our-story" className={END_LINK}>our story</a>, see{' '}
              <a href="/our-impact" className={END_LINK}>our impact</a>, learn about{' '}
              <a href="/bespoke-meals" className={END_LINK}>bespoke meals</a> and{' '}
              <a href="/logistics" className={END_LINK}>logistics</a>, or{' '}
              <a href="/contact" className={END_LINK}>get in-touch</a>!
            </>
          )}
        </h3>
      </div>

      {/* Phones held sideways: the experience is built around a tall viewport, and in
          landscape the words and the arched logo have nowhere to go. Driven purely by a
          media query — short AND landscape, so tablets and laptops never see it. */}
      <div className="fixed inset-0 z-[70] hidden flex-col items-center justify-center gap-4 bg-[#000666] px-8 text-center [@media(orientation:landscape)and(max-height:520px)]:flex">
        <svg
          className="h-12 w-12 text-[#ff6666]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
          <path d="M20 9a8 8 0 0 0-3-4M4 15a8 8 0 0 0 3 4" />
        </svg>
        <p className="font-spirit text-xl font-medium text-[#ff6666]">Rotate your device</p>
        <p className="text-sm text-white/60">This experience is built for portrait.</p>
      </div>

      <Modal />
      <HomeControls />
      <HomeProgress visible={showProgress} />
      <HomeWeekly posts={latestWeekly} visible={showWeekly} />
    </>
  );
}
