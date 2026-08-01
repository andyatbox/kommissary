import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * A Kommissary Weekly Post — the blog content type. Same page-builder `sections` as a
 * Page, plus an early Thumbnail image (for the teaser grid) and an editable Published
 * date. The date is a normal field, so it's set by the author and NOT changed when the
 * content is edited (unlike _updatedAt). Posts render at /weekly/<slug>.
 */
export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Published date, oldest first',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL path)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'The path after /weekly/, e.g. "our-new-kitchen" → /weekly/our-new-kitchen',
      validation: (r) => r.required(),
    }),
    // Early field: the teaser-card background image.
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      description:
        'Background of this post’s teaser card on the Kommissary Weekly grid. Optional — a post without one gets a frosted-glass card instead.',
    }),
    defineField({
      name: 'date',
      title: 'Published date',
      type: 'datetime',
      description:
        'Shown on the post and its teaser, and orders the grid (newest first). Editable — it is NOT changed when you edit the content.',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 2,
      description: 'Used for SEO / social previews.',
    }),
    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      description:
        'Build the post by adding sections in any order — same options as Pages. Drag to reorder.',
      of: [
        defineArrayMember({ type: 'bodyCopy' }),
        defineArrayMember({ type: 'videoEmbed' }),
        defineArrayMember({ type: 'imageSlider' }),
        defineArrayMember({ type: 'gridCopy' }),
        defineArrayMember({ type: 'htmlEmbed' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', date: 'date', media: 'thumbnail' },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: date
        ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'No date',
      media,
    }),
  },
});
