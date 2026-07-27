import { urlFor } from '@/sanity/lib/image';

/** A Sanity image (asset ref + hotspot/crop + our alt), plus the LQIP the query pulls
 *  from asset metadata. */
export type SanityGalleryImage = {
  asset?: { _ref?: string } | null;
  hotspot?: { x: number; y: number } | null;
  crop?: unknown;
  alt?: string | null;
  lqip?: string | null;
};

/** A gallery image resolved to optimized, responsive delivery URLs. */
export type GalleryImage = {
  /** Default src (a mid-range width) for browsers without srcSet support. */
  src: string;
  /** Responsive candidates across widths, each `url 1234w`. */
  srcSet?: string;
  /** Matches how wide the slide renders, so the browser picks the right candidate. */
  sizes?: string;
  alt: string;
  /** CSS object-position from the image's hotspot, so object-cover keeps the focal
   *  point in frame at any aspect ratio. */
  objectPosition?: string;
  /** Tiny base64 blur-up placeholder shown while the full image loads. */
  lqip?: string;
};

/** Widths requested from the Sanity image CDN for the responsive srcSet. */
const GALLERY_WIDTHS = [480, 768, 1024, 1440, 1920];

/**
 * Builds an optimized, responsive GalleryImage from a Sanity image, or null if the
 * item has no asset yet. `auto('format')` serves AVIF/WebP where supported; hotspot
 * becomes a CSS object-position so object-cover keeps the focal point in frame.
 *
 * @param sizes the CSS `sizes` hint for how wide the image renders in this context.
 */
export function galleryImageFromSanity(
  img: SanityGalleryImage,
  sizes: string
): GalleryImage | null {
  if (!img?.asset?._ref) return null;
  const base = urlFor(img).auto('format').quality(80).fit('max');
  return {
    src: base.width(1024).url(),
    srcSet: GALLERY_WIDTHS.map((w) => `${base.width(w).url()} ${w}w`).join(', '),
    sizes,
    alt: img.alt ?? '',
    objectPosition: img.hotspot
      ? `${(img.hotspot.x * 100).toFixed(1)}% ${(img.hotspot.y * 100).toFixed(1)}%`
      : undefined,
    lqip: img.lqip ?? undefined,
  };
}

/** Maps an array of Sanity images to GalleryImages, dropping any without an asset. */
export function galleryImagesFromSanity(
  imgs: SanityGalleryImage[] | null | undefined,
  sizes: string
): GalleryImage[] {
  return (imgs ?? [])
    .map((img) => galleryImageFromSanity(img, sizes))
    .filter((g): g is GalleryImage => g !== null);
}
