import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';
import { galleryImagesFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import VideoEmbed from './VideoEmbed';
import ImageSlider from './ImageSlider';
import GridCopy from './GridCopy';
import HtmlEmbed from './HtmlEmbed';

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
    }
  | { _type: 'htmlEmbed'; _key: string; code?: string };

/** Renders one page section. Body Copy is a full-width cream band with centred text;
 *  video centres itself; the slider and grid go full browser width. */
export default function SectionRenderer({ section }: { section: PageSection }) {
  switch (section._type) {
    case 'bodyCopy':
      return (
        // Small side margin so the cream band doesn't touch the browser edges.
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Full-width cream band: flatter corners, generous vertical padding. Text
              goes black (links stay coral). */}
          <div className="rounded-lg bg-[#FFE9CC] py-14 sm:py-16 lg:py-24">
            {/* Copy stays in a readable centred column inside the full-width band. */}
            <div className="mx-auto w-full max-w-3xl px-6 sm:px-10 lg:px-16">
              <PortableBody value={section.content ?? []} tone="light" />
            </div>
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
        />
      );
    case 'htmlEmbed':
      return (
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
          <HtmlEmbed code={section.code ?? ''} />
        </div>
      );
    default:
      return null;
  }
}
