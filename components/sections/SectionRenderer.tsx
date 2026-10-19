import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';
import { galleryImageFromSanity, galleryImagesFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import VideoEmbed from './VideoEmbed';
import ImageSlider from './ImageSlider';
import GridCopy from './GridCopy';
import HtmlEmbed from './HtmlEmbed';
import ContactForm from './ContactForm';
import ReelsWaterfall from '@/components/instagram/ReelsWaterfall';
import type { Reel } from '@/lib/instagram/api';

export type PageSection =
  | { _type: 'titleSection'; _key: string; text?: string }
  | { _type: 'bodyCopy'; _key: string; content?: PortableTextBlock[] }
  | {
      _type: 'videoEmbed';
      _key: string;
      url?: string;
      /** A video uploaded in Studio, served from Sanity's CDN. Wins over `url`. */
      file?: { url: string; mimeType?: string };
      /** Uploads only: the Playback checkboxes. */
      autoplay?: boolean;
      muted?: boolean;
      controls?: boolean;
      loop?: boolean;
      caption?: string;
      /** Cover image from Studio, or (Vimeo) fetched server-side — see enrichSections. */
      poster?: string;
      /** Set when the URL is one of our own reels — see enrichSections. */
      reel?: Reel;
    }
  | {
      _type: 'singleImage';
      _key: string;
      image?: SanityGalleryImage & { width?: number; height?: number };
    }
  | { _type: 'imageSlider'; _key: string; images?: SanityGalleryImage[] }
  | {
      _type: 'gridCopy';
      _key: string;
      columns?: string;
      column1?: PortableTextBlock[];
      column2?: PortableTextBlock[];
      column3?: PortableTextBlock[];
      topDivider?: boolean;
      bottomDivider?: boolean;
    }
  | { _type: 'htmlEmbed'; _key: string; code?: string }
  | { _type: 'contactForm'; _key: string; heading?: string; intro?: string }
  | { _type: 'instagramReels'; _key: string; count?: number; reels?: Reel[] };

/** Renders one page section. Body Copy is a full-width cream band with centred text;
 *  video centres itself; the slider and grid go full browser width. */
export default function SectionRenderer({ section }: { section: PageSection }) {
  switch (section._type) {
    case 'titleSection':
      // Same look as the page title, but always centred.
      return section.text ? (
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
          <h1 className="text-balance text-center font-spirit text-4xl font-medium text-[#ff6666] sm:text-5xl">
            {section.text}
          </h1>
        </div>
      ) : null;
    case 'bodyCopy':
      return (
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
          {/* Cream card behind the copy; text goes black (links stay coral). Padding
              grows with the breakpoint. Blended against whatever's behind it (exclusion)
              via the Reveal wrapper one level up — see the section map in page.tsx. */}
          <div className="rounded-2xl bg-[#FFE9CC] px-6 py-8 sm:rounded-3xl sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            <PortableBody value={section.content ?? []} tone="light" />
          </div>
        </div>
      );
    case 'videoEmbed':
      return (
        <VideoEmbed
          url={section.url}
          file={section.file}
          autoplay={section.autoplay}
          muted={section.muted}
          controls={section.controls}
          loop={section.loop}
          caption={section.caption}
          poster={section.poster}
          reel={section.reel}
        />
      );
    case 'singleImage': {
      const img = section.image && galleryImageFromSanity(section.image, '100vw');
      if (!img) return null;
      const ratio = imageRatio(section.image!);
      return (
        // Full width, capped at 75vh: the box takes the image's proportions, so a tall
        // photo narrows and centres instead of being cropped, and a small one still
        // spans the page. Its size is known up front, so nothing shifts as it loads.
        <div
          className="relative mx-auto overflow-hidden rounded-xl"
          style={{
            aspectRatio: ratio,
            width: `min(100%, calc(75vh * ${ratio}))`,
            ...(img.lqip ? { backgroundImage: `url(${img.lqip})`, backgroundSize: 'cover' } : {}),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            srcSet={img.srcSet}
            sizes={img.sizes}
            alt={img.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      );
    }
    case 'imageSlider':
      return <ImageSlider images={galleryImagesFromSanity(section.images, '100vw')} />;
    case 'gridCopy':
      return (
        <GridCopy
          columns={section.columns}
          column1={section.column1}
          column2={section.column2}
          column3={section.column3}
          topDivider={section.topDivider}
          bottomDivider={section.bottomDivider}
        />
      );
    case 'htmlEmbed':
      return (
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
          <HtmlEmbed code={section.code ?? ''} />
        </div>
      );
    case 'contactForm':
      return <ContactForm heading={section.heading} intro={section.intro} />;
    case 'instagramReels':
      return <ReelsWaterfall reels={section.reels ?? []} />;
    default:
      return null;
  }
}

type Crop = { top?: number; bottom?: number; left?: number; right?: number };

/** Width ÷ height of the image as served: its stored dimensions, less any Studio crop. */
function imageRatio(image: { width?: number; height?: number; crop?: unknown }): number {
  const { width, height } = image;
  if (!width || !height) return 16 / 9;
  const c = (image.crop ?? {}) as Crop;
  const w = width * (1 - (c.left ?? 0) - (c.right ?? 0));
  const h = height * (1 - (c.top ?? 0) - (c.bottom ?? 0));
  return w > 0 && h > 0 ? w / h : width / height;
}
