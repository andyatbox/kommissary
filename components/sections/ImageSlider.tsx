'use client';

import GallerySlider from '@/components/story/GallerySlider';
import type { GalleryImage } from '@/lib/galleryImage';

/**
 * Full-browser-width image slider — the same slider/controls as the Our Story
 * galleries. The track is edge-to-edge (slides swipe off the page edges); the controls
 * are inset so the bullets/arrows don't run to the very edges.
 */
export default function ImageSlider({ images }: { images: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="w-full">
      <GallerySlider
        images={images}
        armed
        slideClassName="h-[50vh] md:h-[60vh]"
        controlsClassName="px-6 sm:px-10 lg:px-16"
      />
    </div>
  );
}
