'use client';

import { useState } from 'react';

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

export default function VideoEmbed({ url, caption }: { url: string; caption?: string }) {
  const [playing, setPlaying] = useState(false);
  const video = parseVideo(url);

  if (video.kind === 'unknown') {
    return (
      <figure className="mx-auto w-full max-w-3xl px-6 sm:px-8">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#ff6666] underline">
          Watch video
        </a>
      </figure>
    );
  }

  // Instagram: no facade, portrait-friendly, narrower column.
  if (!video.facade) {
    return (
      <figure className="mx-auto w-full max-w-[420px] px-6 sm:px-8">
        <div className="overflow-hidden rounded-xl bg-black">
          <iframe
            src={video.src}
            title={caption || 'Instagram post'}
            loading="lazy"
            scrolling="no"
            allowFullScreen
            className="aspect-[4/5] w-full"
          />
        </div>
        {caption && <Caption>{caption}</Caption>}
      </figure>
    );
  }

  return (
    <figure className="mx-auto w-full max-w-3xl px-6 sm:px-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black md:max-h-[60vh]">
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
            {video.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail}
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

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-3 text-center text-sm text-white/60">{children}</figcaption>
  );
}
