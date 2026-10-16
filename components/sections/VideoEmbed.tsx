'use client';

import { useEffect, useRef, useState } from 'react';
import ReelCard from '@/components/instagram/ReelCard';
import type { Reel } from '@/lib/instagram/api';

type Parsed =
  | { kind: 'iframe'; src: string; thumbnail?: string; facade: boolean }
  | { kind: 'unknown' };

/** Parse a supported provider URL into an embeddable iframe src (+ poster where cheap). */
function parseVideo(url: string): Parsed {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube — watch?v=, youtu.be/, /shorts/, /embed/
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const id =
        u.searchParams.get('v') ||
        u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] ||
        '';
      if (id)
        return {
          kind: 'iframe',
          facade: true,
          thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
        };
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id)
        return {
          kind: 'iframe',
          facade: true,
          thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
        };
    }

    // Vimeo — vimeo.com/ID or player.vimeo.com/video/ID
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.match(/(\d+)/)?.[1];
      if (id)
        return {
          kind: 'iframe',
          facade: true,
          src: `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`,
        };
    }

    // Gumlet — play.gumlet.io/embed/ID (or any gumlet host, last path segment as id)
    if (host.endsWith('gumlet.io') || host.endsWith('gumlet.tv')) {
      const id = u.pathname.match(/\/(?:embed|watch)\/([\w-]+)/)?.[1] || u.pathname.split('/').filter(Boolean).pop();
      if (id)
        return {
          kind: 'iframe',
          facade: true,
          src: `https://play.gumlet.io/embed/${id}?autoplay=true`,
        };
    }

    // Instagram — /p/, /reel/, /tv/ CODE. Rendered directly (it's a post, not a player).
    if (host === 'instagram.com') {
      const code = u.pathname.match(/\/(?:p|reel|tv)\/([\w-]+)/)?.[1];
      if (code)
        return { kind: 'iframe', facade: false, src: `https://www.instagram.com/p/${code}/embed` };
    }
  } catch {
    // fall through
  }
  return { kind: 'unknown' };
}

function PlayButton() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ff6666] shadow-[0_10px_40px_rgba(255,102,102,0.45)] transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110">
        {/* Navy triangle, nudged right so it reads optically centred. */}
        <svg className="ml-1 h-8 w-8 text-[#000666]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

export default function VideoEmbed({
  url,
  /** A video uploaded in Studio. Played by our own player, and wins over `url`. */
  file,
  /** Uploads only: the Playback checkboxes. */
  autoplay,
  muted,
  controls,
  loop,
  caption,
  /** Cover image from Studio, or fetched server-side (Vimeo). Falls back to the provider thumbnail. */
  poster,
  /** Present when the URL is one of @kommissary's own reels (see enrichSections). */
  reel,
}: {
  url?: string;
  file?: { url: string; mimeType?: string };
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  caption?: string;
  poster?: string;
  reel?: Reel;
}) {
  const [playing, setPlaying] = useState(false);

  if (file) {
    return (
      <UploadedVideo
        src={file.url}
        type={file.mimeType}
        poster={poster}
        caption={caption}
        autoplay={Boolean(autoplay)}
        muted={Boolean(muted)}
        controls={Boolean(controls)}
        loop={Boolean(loop)}
      />
    );
  }
  if (!url) return null;

  const video = parseVideo(url);
  const thumbnail = poster ?? (video.kind === 'iframe' ? video.thumbnail : undefined);

  // One of our own reels: use the same card as the feed, so the play / link-out buttons
  // match. Instagram's own embed can't play video inline, which is what this replaces.
  if (reel) {
    return (
      <figure className="mx-auto w-full max-w-[380px] px-6 sm:px-8">
        <ReelCard reel={reel} />
        {caption && <Caption>{caption}</Caption>}
      </figure>
    );
  }

  if (video.kind === 'unknown') {
    return (
      <figure className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#ff6666] underline">
          Watch video
        </a>
      </figure>
    );
  }

  // Instagram: no facade, portrait post. Fixed height rather than a forced aspect
  // ratio, so the embed isn't stretched to fit.
  if (!video.facade) {
    return (
      <figure className="mx-auto w-full max-w-[400px] px-6 sm:px-8">
        <div className="overflow-hidden rounded-xl bg-black">
          <iframe
            src={video.src}
            title={caption || 'Instagram post'}
            loading="lazy"
            scrolling="no"
            allowFullScreen
            className="h-[640px] w-full"
          />
        </div>
        {caption && <Caption>{caption}</Caption>}
      </figure>
    );
  }

  return (
    <figure className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
      {/* Full width at 16:9 — no max-height, so the frame is never distorted. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {playing ? (
          <iframe
            src={video.src}
            title={caption || 'Video'}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={caption ? `Play: ${caption}` : 'Play video'}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
            <PlayButton />
          </button>
        )}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
}

/**
 * A video file from Sanity's CDN in a plain <video>. Full browser width, sized by the
 * video itself (16:9 until its metadata arrives) and capped at 75vh, so tall or portrait
 * clips shrink and centre instead of being cropped. The four Playback checkboxes:
 *
 * - Autoplay: plays while on screen, pauses off it. Falls back to the play button when
 *   the browser refuses (it will unless Muted is on too) or the visitor asks for reduced
 *   motion.
 * - Muted, Loop: as on any <video>.
 * - Controls: native controls once it's playing. Without them, clicking the video
 *   pauses it and brings the play button back.
 *
 * Otherwise it waits behind the same coral play button as the link embeds, which comes
 * back when the video ends, and only the metadata loads until then.
 */
function UploadedVideo({
  src,
  type,
  poster,
  caption,
  autoplay,
  muted,
  controls,
  loop,
}: {
  src: string;
  type?: string;
  poster?: string;
  caption?: string;
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  loop: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [showButton, setShowButton] = useState(!autoplay);
  const [ratio, setRatio] = useState(16 / 9);
  const reducedMotion = usePrefersReducedMotion();
  const autoplays = autoplay && !reducedMotion;

  const fit = (el: HTMLVideoElement) => {
    if (el.videoWidth && el.videoHeight) setRatio(el.videoWidth / el.videoHeight);
  };
  // The metadata can arrive before hydration, when onLoadedMetadata isn't attached yet.
  useEffect(() => {
    if (ref.current && ref.current.readyState >= 1) fit(ref.current);
  }, []);

  // React doesn't put `muted` in the server HTML, so set it on the element itself.
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (autoplay && reducedMotion) setShowButton(true);
  }, [autoplay, reducedMotion]);

  // Autoplay from here rather than the autoplay attribute, so it only runs on screen. It
  // resumes only what it paused itself, never a video the visitor paused.
  useEffect(() => {
    const el = ref.current;
    if (!autoplays || !el) return;
    let pausedByUs = true;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (pausedByUs && el.paused && !el.ended) {
          pausedByUs = false;
          el.play().catch(() => setShowButton(true));
        }
      } else if (!el.paused) {
        el.pause();
        pausedByUs = true;
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [autoplays]);

  // Called inside the click so iOS allows sound.
  const play = () => ref.current?.play().catch(() => {});

  return (
    <figure className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: ratio, width: `min(100%, calc(75vh * ${ratio}))` }}
      >
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-contain${controls ? '' : ' cursor-pointer'}`}
          poster={poster}
          playsInline
          loop={loop}
          preload={autoplays ? 'auto' : 'metadata'}
          controls={controls && !showButton}
          aria-label={caption || 'Video'}
          onLoadedMetadata={(e) => fit(e.currentTarget)}
          onPlay={() => setShowButton(false)}
          onEnded={() => setShowButton(true)}
          // Without controls the play button is the only cue it's paused, so bring it back.
          onPause={() => !controls && setShowButton(true)}
          onClick={controls ? undefined : (e) => e.currentTarget.pause()}
        >
          {/* Without a cover image, the #t fragment makes iOS Safari paint the first frame. */}
          <source src={poster ? src : `${src}#t=0.001`} type={type} />
        </video>
        {showButton && (
          <button
            type="button"
            onClick={play}
            aria-label={caption ? `Play: ${caption}` : 'Play video'}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
            <PlayButton />
          </button>
        )}
      </div>
      {caption && <div className="px-6 sm:px-8"><Caption>{caption}</Caption></div>}
    </figure>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-3 text-center text-sm text-white/60">{children}</figcaption>
  );
}
