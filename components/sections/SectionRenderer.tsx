import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';
import { galleryImagesFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import VideoEmbed from './VideoEmbed';
import ImageSlider from './ImageSlider';
import GridCopy from './GridCopy';
import HtmlEmbed from './HtmlEmbed';
import ContactForm from './ContactForm';

export type PageSection =
  | { _type: 'bodyCopy'; _key: string; content?: PortableTextBlock[] }
  | { _type: 'videoEmbed'; _key: string; url: string; caption?: string; poster?: string }
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
  | { _type: 'contactForm'; _key: string; heading?: string; intro?: string };

/** Renders one page section. Body Copy is a full-width cream band with centred text;
 *  video centres itself; the slider and grid go full browser width. */
export default function SectionRenderer({ section }: { section: PageSection }) {
  switch (section._type) {
    case 'bodyCopy':
      return (
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
          {/* Cream card behind the copy; text goes black (links stay coral). Padding
              grows with the breakpoint. Blended against whatever's behind it (exclusion)
              via the Reveal wrapper one level up — see the section map in page.tsx. */}
          <div className="rounded-2xl bg-[#FFE9CC] px-6 py-8 sm:rounded-3xl sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            <PortableBody value={section.content ?? []} tone="light" />
          </div>
        </div>
      );
    case 'videoEmbed':
      return <VideoEmbed url={section.url} caption={section.caption} poster={section.poster} />;
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
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
          <HtmlEmbed code={section.code ?? ''} />
        </div>
      );
    case 'contactForm':
      return <ContactForm heading={section.heading} intro={section.intro} />;
    default:
      return null;
  }
}
