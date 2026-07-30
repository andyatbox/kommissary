import { defineArrayMember, defineField, defineType } from 'sanity';

/** Align-center toolbar icon for the custom 'center' decorator (Sanity has no built-in
 *  one, so a bare custom decorator renders a "?" placeholder). Matches Sanity's icon
 *  conventions: 1em, 25×25 viewBox, currentColor stroke. */
const CenterAlignIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 25 25"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 7h15M8 12h9M6 17h13" />
  </svg>
);

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
          { title: 'Center', value: 'center', icon: CenterAlignIcon },
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
