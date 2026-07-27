import type { PortableTextBlock } from '@portabletext/types';
import PortableBody from '@/components/PortableBody';

/**
 * Full-width 2- or 3-column rich text. Columns stack on mobile. The section carries the
 * page's X padding (larger on wide desktop); the columns wrapper adds a little more so
 * the outer columns sit evenly inside that padding rather than flush against it.
 */
export default function GridCopy({
  columns,
  column1,
  column2,
  column3,
}: {
  columns?: string;
  column1?: PortableTextBlock[];
  column2?: PortableTextBlock[];
  column3?: PortableTextBlock[];
}) {
  const three = columns === '3';
  const cols: (PortableTextBlock[] | undefined)[] = three
    ? [column1, column2, column3]
    : [column1, column2];

  return (
    <section className="w-full px-6 sm:px-10 lg:px-24 xl:px-32">
      <div
        className={`mx-auto grid grid-cols-1 gap-10 px-0 md:gap-12 lg:px-8 ${
          three ? 'md:grid-cols-3' : 'md:grid-cols-2'
        }`}
      >
        {cols.map((c, i) => (
          <div key={i}>
            <PortableBody value={c ?? []} />
          </div>
        ))}
      </div>
    </section>
  );
}
