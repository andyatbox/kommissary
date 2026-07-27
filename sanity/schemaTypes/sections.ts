import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * The page-builder section types. A Page's `sections` array can hold any number of
 * these, in any order (drag to reorder). Each renders with its own width behaviour —
 * see components/sections/SectionRenderer.tsx.
 */

/** Rich text at the normal page column width. */
export const bodyCopy = defineType({
  name: 'bodyCopy',
  title: 'Body Copy',
  type: 'object',
  fields: [defineField({ name: 'content', type: 'blockContent', title: 'Content' })],
  preview: {
    select: { content: 'content' },
    prepare: ({ content }) => ({
      title: 'Body Copy',
      subtitle: firstLine(content),
    }),
  },
});

/** An embedded video (YouTube, Vimeo, Gumlet, Instagram) at the normal page width. */
export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'Paste a YouTube, Vimeo, Gumlet, or Instagram link.',
      validation: (r) => r.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
  preview: {
    select: { url: 'url', caption: 'caption' },
    prepare: ({ url, caption }) => ({ title: 'Video Embed', subtitle: caption || url }),
  },
});

/** A full-bleed image slider (same slider as the Our Story galleries). */
export const imageSlider = defineType({
  name: 'imageSlider',
  title: 'Image Slider',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
        }),
      ],
    }),
  ],
  preview: {
    select: { images: 'images', first: 'images.0' },
    prepare: ({ images, first }) => ({
      title: 'Image Slider',
      subtitle: `${images?.length ?? 0} image${images?.length === 1 ? '' : 's'}`,
      media: first,
    }),
  },
});

/** Full-width 2- or 3-column rich text. */
export const gridCopy = defineType({
  name: 'gridCopy',
  title: 'Grid Copy',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'string',
      initialValue: '2',
      options: {
        list: [
          { title: 'Two columns', value: '2' },
          { title: 'Three columns', value: '3' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'column1', title: 'Column 1', type: 'blockContent' }),
    defineField({ name: 'column2', title: 'Column 2', type: 'blockContent' }),
    defineField({
      name: 'column3',
      title: 'Column 3',
      type: 'blockContent',
      hidden: ({ parent }) => parent?.columns !== '3',
    }),
  ],
  preview: {
    select: { columns: 'columns' },
    prepare: ({ columns }) => ({ title: 'Grid Copy', subtitle: `${columns ?? 2} columns` }),
  },
});

/** Pulls the first run of plain text out of a block array for list previews. */
function firstLine(content?: { _type?: string; children?: { text?: string }[] }[]): string {
  const block = content?.find((b) => b._type === 'block');
  return block?.children?.map((c) => c.text).join('') ?? 'Empty';
}
