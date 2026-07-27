import { defineArrayMember, defineField, defineType } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

/**
 * A standalone content page (e.g. /our-story, /services, /contact). The slug is the
 * URL path. The Navigation fields decide which header dropdown (if any) the page's
 * link appears in — the site's nav is built from these, not a separate document.
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fieldsets: [{ name: 'nav', title: 'Navigation', options: { collapsible: true, collapsed: false } }],
  // Drag-to-reorder in the Pages list drives link order within each nav column.
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'page' }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL path)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'The path after the domain, e.g. "our-story" → /our-story',
      validation: (r) => r.required(),
    }),
    // --- Navigation placement (kept right after the slug) ---
    defineField({
      name: 'navGroup',
      title: 'Dropdown menu',
      type: 'string',
      fieldset: 'nav',
      description: 'Which header dropdown this page appears in. Leave empty to hide it from the nav.',
      options: {
        list: [
          { title: 'Kommissary', value: 'kommissary' },
          { title: 'What we do', value: 'what-we-do' },
          { title: 'Connect', value: 'connect' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'navLabel',
      title: 'Nav link text',
      type: 'string',
      fieldset: 'nav',
      description: 'Text shown in the dropdown. Defaults to the page title if left blank.',
    }),
    defineField({
      name: 'navColumn',
      title: 'Column',
      type: 'number',
      fieldset: 'nav',
      initialValue: 2,
      description: 'Column 1 is the fixed heading; links go in column 2 or 3.',
      options: {
        list: [
          { title: 'Column 2', value: 2 },
          { title: 'Column 3', value: 3 },
        ],
        layout: 'radio',
      },
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
    select: { title: 'title', slug: 'slug.current', navGroup: 'navGroup' },
    prepare: ({ title, slug, navGroup }) => ({
      title,
      subtitle: [slug ? `/${slug}` : 'no slug', navGroup ? `↳ ${navGroup}` : null]
        .filter(Boolean)
        .join('   '),
    }),
  },
});
