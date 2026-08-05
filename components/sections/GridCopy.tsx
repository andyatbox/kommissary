import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';

/** True if a column's rich text contains an inline image. */
function hasImageBlock(col?: PortableTextBlock[]): boolean {
  return !!col?.some((b) => (b as { _type?: string })._type === 'image');
}

/**
 * Full-width 2- or 3-column rich text. Columns stack on mobile. The section carries the
 * page's X padding (larger on wide desktop); the columns wrapper adds a little more so
 * the outer columns sit evenly inside that padding rather than flush against it.
 *
 * Inline images have their default top margin removed here (they sit at the top of a
 * column). In a two-column layout where one column has an image, the columns are
 * vertically centred so the text sits against the middle of the image.
 */
export default function GridCopy({
  columns,
  column1,
  column2,
  column3,
  topDivider,
  bottomDivider,
}: {
  columns?: string;
  column1?: PortableTextBlock[];
  column2?: PortableTextBlock[];
  column3?: PortableTextBlock[];
  topDivider?: boolean;
  bottomDivider?: boolean;
}) {
  const three = columns === '3';
  const cols: (PortableTextBlock[] | undefined)[] = three
    ? [column1, column2, column3]
    : [column1, column2];

  // Centre only a two-column layout, and only when one of the two holds an image.
  const centre = !three && cols.some(hasImageBlock);

  // Optional red rules. The border sits outside the section's X padding, so it spans the
  // full browser width; the margin opens up space beyond it, away from the content.
  const dividers = [
    topDivider ? 'border-t-[3px] border-[#ff6666] mt-24 pt-12 sm:mt-32 sm:pt-16' : '',
    bottomDivider ? 'border-b-[3px] border-[#ff6666] mb-24 pb-12 sm:mb-32 sm:pb-16' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={`w-full px-6 sm:px-10 lg:px-24 xl:px-32 ${dividers}`}>
      <div
        className={`mx-auto grid grid-cols-1 gap-10 px-0 md:gap-12 lg:px-8 ${
          three ? 'md:grid-cols-3' : 'md:grid-cols-2'
        } ${centre ? 'md:items-center' : ''}`}
      >
        {cols.map((c, i) => (
          <div key={i} className="[&_img]:mt-0">
            <PortableBody value={c ?? []} />
          </div>
        ))}
      </div>
    </section>
  );
}
