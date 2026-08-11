'use client';

import { useRef, useState } from 'react';
import type { Reel } from '@/lib/instagram/api';

/** Coral disc that both buttons sit in, so the two treatments read as siblings. */
const DISC =
  'flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6666] text-[#000666] shadow-[0_10px_40px_rgba(255,102,102,0.45)] transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110';

function PlayIcon() {
  return (
    // Nudged right so the triangle reads optically centred in the disc.
    <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Arrow out of a box — the standard "this leaves the site" sign. */
function ExternalIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 5h6v6M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

/**
 * One reel. Reels Instagram gives us a file for play in place; the rest show the same
 * poster with an "opens Instagram" button, because Instagram serves no video for them at
 * all (see lib/instagram/api.ts). The poster is the shared element either way, so the
 * grid stays visually consistent.
 */
export default function ReelCard({ reel }: { reel: Reel }) {
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const caption = reel.caption.replace(/\s+/g, ' ').trim();

  // Can't play here — the whole card is a link out to Instagram.
  if (!reel.canPlayInline) {
    return (
      <a
        href={reel.permalink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={caption ? `Watch on Instagram: ${caption}` : 'Watch on Instagram'}
        className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10"
      >
        <Poster reel={reel} />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className={DISC}>
            <ExternalIcon />
          </span>
        </span>
        <Caption text={caption} />
      </a>
    );
  }

  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">
      {playing ? (
        <video
          ref={video}
          // Resolved server-side at play time — Instagram's file URLs expire.
          src={`/api/instagram/video/${reel.id}`}
          poster={reel.poster}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={caption ? `Play: ${caption}` : 'Play reel'}
          className="absolute inset-0 h-full w-full cursor-pointer"
        >
          <Poster reel={reel} />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className={DISC}>
              <PlayIcon />
            </span>
          </span>
          <Caption text={caption} />
        </button>
      )}
    </div>
  );
}

function Poster({ reel }: { reel: Reel }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reel.poster}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-[#000666]/85 via-transparent to-transparent" />
    </>
  );
}

function Caption({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-left text-xs leading-snug text-white/90">
      {text}
    </span>
  );
}
