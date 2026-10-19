import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * The page-builder section types. A Page's `sections` array can hold any number of
 * these, in any order (drag to reorder). Each renders with its own width behaviour —
 * see components/sections/SectionRenderer.tsx.
 */

/** One line of text as a centred page heading — no card behind it, unlike Body Copy. */
export const titleSection = defineType({
  name: 'titleSection',
  title: 'Title',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({ title: 'Title', subtitle: text }),
  },
});

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

/** Above this an uploaded video gets a warning: it's slow to start on a phone. */
const VIDEO_WARN_BYTES = 80 * 1024 * 1024;

/** Checkboxes for uploaded videos, all off by default. See UploadedVideo for how they combine. */
const PLAYBACK_OPTIONS = [
  { name: 'autoplay', title: 'Autoplay', description: 'Plays when scrolled into view. Browsers only allow this when Muted is also checked.' },
  { name: 'muted', title: 'Muted', description: 'No sound until a visitor turns it on (needs Controls).' },
  { name: 'controls', title: 'Controls', description: 'Shows the play bar, volume and full screen.' },
  { name: 'loop', title: 'Loop', description: 'Starts again when it ends.' },
] as const;

/**
 * A video at the normal page width: either a link (YouTube, Vimeo, Gumlet, Instagram)
 * or a file uploaded here, which Sanity's CDN serves to our own player. Named
 * `videoEmbed` from when it only took links; renaming it would orphan existing sections.
 */
export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video',
  type: 'object',
  fieldsets: [
    {
      name: 'playback',
      title: 'Playback',
      options: { columns: 2 },
      // A fieldset's callback isn't handed the same `parent` as a field's, so check the
      // object's own value too.
      hidden: ({ parent, value }) => !(value?.file?.asset || parent?.file?.asset),
    },
  ],
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'Paste a YouTube, Vimeo, Gumlet, or Instagram link, or upload a video below.',
      hidden: ({ parent }) => Boolean(parent?.file?.asset) && !parent?.url,
      validation: (r) =>
        r.uri({ scheme: ['http', 'https'] }).custom((url, ctx) => {
          const parent = ctx.parent as { file?: { asset?: unknown } } | undefined;
          return url || parent?.file?.asset ? true : 'Add a video link or upload a video.';
        }),
    }),
    defineField({
      name: 'file',
      title: 'Upload a video',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      description:
        'MP4 (H.264), ideally 1080p and under 80 MB. iPhone videos (.mov) need exporting as MP4 first.',
      hidden: ({ parent }) => Boolean(parent?.url) && !parent?.file?.asset,
      validation: (r) =>
        r
          .custom(async (value, ctx) => {
            const ref = (value as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
            if (!ref) return true;
            const size: number | null = await ctx
              .getClient({ apiVersion: '2024-10-01' })
              .fetch('*[_id == $id][0].size', { id: ref });
            return size && size > VIDEO_WARN_BYTES
              ? `This video is ${Math.round(size / 1024 / 1024)} MB, so it will be slow to start on phones. Try exporting it smaller.`
              : true;
          })
          .warning(),
    }),
    ...PLAYBACK_OPTIONS.map(({ name, title, description }) =>
      defineField({
        name,
        title,
        description,
        type: 'boolean',
        fieldset: 'playback',
        options: { layout: 'checkbox' },
        initialValue: false,
      })
    ),
    defineField({
      name: 'poster',
      title: 'Cover image',
      type: 'image',
      description:
        'Shown before the video plays. Optional: without one, uploads show their first frame and links use the provider’s thumbnail.',
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
  preview: {
    select: { url: 'url', caption: 'caption', fileName: 'file.asset.originalFilename', media: 'poster' },
    prepare: ({ url, caption, fileName, media }) => ({
      title: 'Video',
      subtitle: caption || fileName || url,
      media,
    }),
  },
});

/** One image, full browser width and capped at 75vh, shown whole (never cropped to fit). */
export const singleImage = defineType({
  name: 'singleImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (r) => r.required(),
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
  ],
  preview: {
    select: { media: 'image', alt: 'image.alt' },
    prepare: ({ media, alt }) => ({ title: 'Image', subtitle: alt, media }),
  },
});

/** A full-bleed image slider. */
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
    // Optional red rules above/below the section, for a hard visual break between
    // sections. Kept first so they read as section-level options, before the content.
    defineField({
      name: 'topDivider',
      title: 'Top divider',
      type: 'boolean',
      initialValue: false,
      description: 'Adds a red rule across the top of this section, with space above it.',
    }),
    defineField({
      name: 'bottomDivider',
      title: 'Bottom divider',
      type: 'boolean',
      initialValue: false,
      description: 'Adds a red rule across the bottom of this section, with space below it.',
    }),
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

/** Raw HTML embed — for third-party widgets, iframes, forms, etc. */
export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  title: 'HTML Embed Code',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'Embed code (HTML)',
      type: 'text',
      rows: 6,
      description:
        'Paste an embed/widget snippet (iframe, script, form, etc.). Renders exactly as given — only paste code from sources you trust.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { code: 'code' },
    prepare: ({ code }) => ({
      title: 'HTML Embed',
      subtitle: (code ?? '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Empty',
    }),
  },
});

/** Pulls the first run of plain text out of a block array for list previews. */
function firstLine(content?: { _type?: string; children?: { text?: string }[] }[]): string {
  const block = content?.find((b) => b._type === 'block');
  return block?.children?.map((c) => c.text).join('') ?? 'Empty';
}

/**
 * The contact form. Renders our own Tailwind-styled form (not a Google iframe) that
 * posts through /api/contact into the "Contact Kommissary" Google Form, so responses
 * still land in the client's existing spreadsheet + notification flow.
 *
 * The fields themselves live in code, not here — they have to mirror the Google Form's
 * questions exactly, so they aren't editor-configurable. Only the surrounding copy is.
 */
export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional heading shown above the form, e.g. "Send us a message".',
    }),
    defineField({
      name: 'intro',
      title: 'Intro text',
      type: 'text',
      rows: 3,
      description: 'Optional short paragraph between the heading and the first field.',
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: 'Contact Form', subtitle: heading || 'No heading' }),
  },
});

/**
 * The @kommissary Instagram reels feed. Pulled live from the Instagram API — there's
 * nothing to maintain here, only how many to show.
 */
export const instagramReels = defineType({
  name: 'instagramReels',
  title: 'Instagram Reels Feed',
  type: 'object',
  fields: [
    defineField({
      name: 'count',
      title: 'How many reels',
      type: 'number',
      initialValue: 12,
      validation: (r) => r.min(1).max(48).integer(),
      description: 'Most recent first. Up to 48.',
    }),
  ],
  preview: {
    select: { count: 'count' },
    prepare: ({ count }) => ({
      title: 'Instagram Reels Feed',
      subtitle: `${count ?? 12} most recent`,
    }),
  },
});
