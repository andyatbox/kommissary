import { defineArrayMember, defineField, defineType } from 'sanity';

/** A clickable link in a nav column. */
export const navLink = defineType({
  name: 'navLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'text', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'href',
      title: 'URL / path',
      type: 'string',
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: 'text', subtitle: 'href' } },
});

/** A non-link heading (the white h2 at the top of a menu). */
export const navHeading = defineType({
  name: 'navHeading',
  title: 'Heading',
  type: 'object',
  fields: [defineField({ name: 'text', type: 'string', validation: (r) => r.required() })],
  preview: {
    select: { title: 'text' },
    prepare: ({ title }) => ({ title, subtitle: 'Heading' }),
  },
});

/** One column in a dropdown menu — a stack of headings and links. */
export const navColumn = defineType({
  name: 'navColumn',
  title: 'Column',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({ type: 'navHeading' }), defineArrayMember({ type: 'navLink' })],
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare: ({ items }) => ({ title: `Column (${items?.length ?? 0} items)` }),
  },
});

/** A top-level dropdown menu (e.g. "Kommissary", "What we do", "Connect"). */
export const navMenu = defineType({
  name: 'navMenu',
  title: 'Menu',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'columns',
      type: 'array',
      of: [defineArrayMember({ type: 'navColumn' })],
      validation: (r) => r.max(3),
    }),
  ],
  preview: { select: { title: 'label' } },
});

/** Singleton holding the header's dropdown menus. */
export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'menus',
      title: 'Dropdown menus',
      type: 'array',
      of: [defineArrayMember({ type: 'navMenu' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
});
