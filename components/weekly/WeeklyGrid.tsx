'use client';

import { useEffect, useRef } from 'react';
import type { GalleryImage } from '@/lib/galleryImage';

export type TeaserPost = {
  slug: string;
  title: string;
  /** Pre-formatted published date, e.g. "Jul 31, 2026". */
  date: string;
  /** Resolved thumbnail, or null → a frosted-glass card. */
  image: GalleryImage | null;
};

/**
 * The Kommissary Weekly teaser grid. Each card links to its post; its thumbnail is an
 * oversized inner background that parallaxes as you scroll (updated on scroll via one
 * rAF-throttled pass over the cards). Posts without a thumbnail get no background color
 * — just a strong backdrop blur over the site's animated gradient.
 */
export default function WeeklyGrid({ posts }: { posts: TeaserPost[] }) {
  const imgs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (const img of imgs.current) {
        if (!img) continue;
        const card = img.parentElement;
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue; // skip well off-screen
        const n = (rect.top + rect.height / 2 - vh / 2) / vh; // ~[-0.6, 0.6] in view
        const shift = Math.max(-8, Math.min(8, -n * 16)); // percent, within the ±8% slack
        img.style.transform = `translate3d(0, ${shift}%, 0)`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [posts]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, i) => (
        <a
          key={post.slug}
          href={`/weekly/${post.slug}`}
          className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
        >
          {post.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  imgs.current[i] = el;
                }}
                src={post.image.src}
                srcSet={post.image.srcSet}
                sizes={post.image.sizes}
                alt={post.image.alt}
                loading="lazy"
                style={post.image.objectPosition ? { objectPosition: post.image.objectPosition } : undefined}
                className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
              />
              {/* Light scrim so the dark-blue text stays legible over any photo. */}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#FFE9CC]/90 via-[#FFE9CC]/35 to-transparent" />
            </>
          ) : (
            // No thumbnail → no background color, just a strong backdrop blur.
            <div className="absolute inset-0 backdrop-blur-2xl" />
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-left">
            <time className="text-sm font-medium text-[#000666]/80">{post.date}</time>
            <h3 className="font-spirit mt-1 text-xl font-medium leading-tight text-[#000666] transition-colors group-hover:text-[#c2402f] sm:text-2xl">
              {post.title}
            </h3>
          </div>
        </a>
      ))}
    </div>
  );
}
