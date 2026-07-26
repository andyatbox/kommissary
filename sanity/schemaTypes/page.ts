import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * A standalone content page (e.g. /our-story, /services, /contact). The slug is
 * the URL path, so it should match the hrefs used by the nav and pill buttons.
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL path)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'The path after the domain, e.g. "our-story" → /our-story',
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
      name: 'body',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'image', options: { hotspot: true } }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/${slug}` : 'no slug set' }),
  },
});
