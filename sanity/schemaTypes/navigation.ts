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
  preview: {
    select: { title: 'text', subtitle: 'href' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Link', subtitle: `Link · ${subtitle ?? ''}` }),
  },
});

/** A non-link heading (the white h2 at the top of a column). */
export const navHeading = defineType({
  name: 'navHeading',
  title: 'Heading',
  type: 'object',
  fields: [defineField({ name: 'text', type: 'string', validation: (r) => r.required() })],
  preview: {
    select: { title: 'text' },
    prepare: ({ title }) => ({ title: title || 'Heading', subtitle: 'Heading' }),
  },
});

/** One column in a dropdown menu — a heading and/or any number of links. */
export const navColumn = defineType({
  name: 'navColumn',
  title: 'Column',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({ type: 'navHeading' }), defineArrayMember({ type: 'navLink' })],
      description: 'Add a Heading and/or Links — multiple links per column are fine.',
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare: ({ items }) => {
      const list = (items ?? []) as { _type: string; text?: string }[];
      const headings = list.filter((i) => i._type === 'navHeading').length;
      const links = list.filter((i) => i._type === 'navLink').length;
      const parts: string[] = [];
      if (headings) parts.push(`${headings} heading${headings > 1 ? 's' : ''}`);
      if (links) parts.push(`${links} link${links > 1 ? 's' : ''}`);
      return {
        title: list[0]?.text || 'Column',
        subtitle: parts.join(' · ') || 'empty',
      };
    },
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
      title: 'Columns',
      type: 'array',
      of: [defineArrayMember({ type: 'navColumn' })],
      description: 'Up to 3 columns, shown left-to-right across the dropdown on desktop.',
      validation: (r) => r.max(3),
    }),
  ],
  preview: {
    select: { label: 'label', columns: 'columns' },
    prepare: ({ label, columns }) => ({
      title: label || 'Menu',
      subtitle: `${columns?.length ?? 0} column${columns?.length === 1 ? '' : 's'}`,
    }),
  },
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
