import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';
import { galleryImagesFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import VideoEmbed from './VideoEmbed';
import ImageSlider from './ImageSlider';
import GridCopy from './GridCopy';

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
    };

/** The normal page column: readable width, centred, with page-edge padding. */
const CONTAINED = 'mx-auto w-full max-w-3xl px-6 sm:px-8';

/** Renders one page section. Contained sections (body, video) centre themselves; the
 *  slider and grid go full browser width and manage their own edges. */
export default function SectionRenderer({ section }: { section: PageSection }) {
  switch (section._type) {
    case 'bodyCopy':
      return (
        <div className={CONTAINED}>
          <PortableBody value={section.content ?? []} />
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
    default:
      return null;
  }
}
