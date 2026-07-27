'use client';

import GallerySlider from '@/components/story/GallerySlider';
import type { GalleryImage } from '@/lib/galleryImage';

/**
 * Full-browser-width image slider — the same slider/controls as the Our Story
 * galleries. The track is edge-to-edge (slides swipe off the page edges); the controls
 * are inset. Images show whole (contain): full height / auto width / centred on desktop
 * capped at 60vh, and full width with edge padding on mobile.
 */
export default function ImageSlider({ images }: { images: GalleryImage[] }) {
  if (!images.length) return null;
  return (
    <div className="w-full">
      <GallerySlider
        images={images}
        armed
        imageFit="contain"
        slideClassName="md:h-[60vh]"
        slidePadClassName="px-4 md:px-0"
        controlsClassName="px-6 sm:px-10 lg:px-16"
      />
    </div>
  );
}
