import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * The link annotation, as a NAMED top-level type (registered in schemaTypes and
 * referenced by name below). It must not be defined inline in the block's annotations:
 * an inline annotation type is re-resolved on every change, which closes the Studio's
 * link-edit popover on each keystroke. Same `_type: 'link'`, so existing links are
 * unaffected.
 */
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'href',
      type: 'url',
      title: 'URL',
      validation: (r) =>
        r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),
  ],
});

/**
 * Reusable rich-text field: paragraphs, a couple of heading levels, quotes, lists,
 * inline emphasis + links, a center-align toggle, and inline images. Shared by the Body
 * Copy section and each column of a Grid Copy section, rendered by PortableBody.tsx.
 */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          // Center-align toggle. It marks the selected text; the renderer centers the
          // whole block if any of its text carries this mark (alignment is block-level).
          { title: 'Center', value: 'center' },
        ],
        annotations: [defineArrayMember({ type: 'link' })],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
  ],
});
