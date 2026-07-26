import createImageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { dataset, projectId } from '../env';

const builder = createImageUrlBuilder({ projectId, dataset });

/** Build a URL for a Sanity image asset. e.g. urlFor(img).width(800).url() */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
