'use client';

import { useEffect, useRef, useState } from 'react';
import type { TeaserPost } from './weekly/WeeklyGrid';

/** Below this side-gap (px between the strip's edge and the viewport edge) the bottom
 *  corners — the ‹ › nav (bottom-left) and the Kai launcher (bottom-right) — are close
 *  enough that the strip lifts above them instead of sharing the bottom band. */
const CORNER_SAFE = 160;

/**
 * A miniature "Kommissary Weekly" strip pinned to the bottom-centre of the landing
 * experience. It shows on the opening splash and again on the end screen, and hides while
 * you scroll through the sentence. The three teasers never stack — they shrink to stay on
 * one row — and the whole strip lifts above the corner CTAs on narrow viewports.
 */
export default function HomeWeekly({ posts, visible }: { posts: TeaserPost[]; visible: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);
  // Delay the first appearance a touch so it eases in after the scene settles.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const check = () => {
      const el = contentRef.current;
      if (!el) return;
      setLifted((window.innerWidth - el.offsetWidth) / 2 < CORNER_SAFE);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [posts]);

  if (!posts.length) return null;
  const show = entered && visible;

  return (
    <div
      aria-hidden={!show}
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 transition-[bottom] duration-500 ease-out"
      // Sits above the scroll-progress meter (HomeProgress, pinned at the bottom centre);
      // `lifted` raises it further still when it would otherwise reach the corner CTAs.
      style={{ bottom: lifted ? 156 : 88 }}
    >
      <div
        ref={contentRef}
        className={`w-full max-w-[520px] text-center transition-[opacity,transform] duration-700 ease-out ${
          show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <h3 className="font-spirit text-sm font-medium tracking-wide text-[#ff6666] sm:text-base">
          Kommissary Weekly
          <span aria-hidden className="mx-2 font-normal text-[#ff6666]/40">
            |
          </span>
          <a
            href="/weekly"
            className={`underline decoration-[#ff6666]/40 underline-offset-4 transition-colors hover:text-[#ffcf33] ${
              show ? 'pointer-events-auto' : ''
            }`}
          >
            All Posts
          </a>
        </h3>

        {/* Never stacks: a flex row where each teaser shrinks (min-w-0) to stay in line. */}
        <div className="mt-3 flex items-start justify-center gap-2.5 sm:gap-3">
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`/weekly/${post.slug}`}
              className={`group relative block aspect-[16/10] min-w-0 flex-1 basis-0 overflow-hidden rounded-lg ring-1 ring-white/15 transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.04] sm:max-w-[160px] ${
                show ? 'pointer-events-auto' : ''
              }`}
            >
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image.src}
                  srcSet={post.image.srcSet}
                  sizes={post.image.sizes}
                  alt={post.image.alt}
                  loading="lazy"
                  style={
                    post.image.objectPosition
                      ? { objectPosition: post.image.objectPosition }
                      : undefined
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
              )}

              {/* Gradient tint below + the title overlaid on it, in red. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#000666]/95 via-[#000666]/55 to-transparent px-2 pb-1.5 pt-6">
                <h4 className="font-spirit line-clamp-2 text-left text-[10px] font-medium leading-tight text-[#ff6666] transition-colors group-hover:text-[#ffcf33] sm:text-xs">
                  {post.title}
                </h4>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
