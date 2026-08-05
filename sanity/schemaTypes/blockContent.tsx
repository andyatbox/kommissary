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

/** Toolbar icon for the anchor annotation — a "#", the sign of a URL fragment. A custom
 *  annotation with no icon renders a "?" placeholder, same as a bare decorator. */
const AnchorIcon = () => (
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
    <path d="M10 5L8 20M17 5l-2 15M5 10h15M4 16h15" />
  </svg>
);

/**
 * The anchor annotation: marks a run of text as a jump target, so a menu (or any link)
 * can scroll to it via `#its-id`. Named + registered exactly like `link` below — an
 * inline annotation type re-resolves on every keystroke and closes the Studio popover.
 */
export const anchor = defineType({
  name: 'anchor',
  title: 'Anchor',
  type: 'object',
  // Edit in a centred dialog rather than the default inline popover. The popover is
  // positioned against the text selection and is fragile — it can close mid-typing and
  // clip fields below the first. A dialog is a stable surface with room for every field.
  options: { modal: { type: 'dialog' } },
  fields: [
    defineField({
      name: 'id',
      title: 'Anchor ID',
      type: 'string',
      description:
        'Lowercase letters, numbers and hyphens only — this becomes the link, e.g. "our-process" → /page#our-process. Must be unique on the page.',
      validation: (r) =>
        r
          .required()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            name: 'anchor ID (lowercase letters, numbers and hyphens, e.g. "our-process")',
          }),
    }),
    defineField({
      name: 'label',
      title: 'Menu label',
      type: 'string',
      description:
        'Optional. What the jump-to menu shows for this anchor — defaults to the highlighted text if left blank.',
    }),
  ],
  preview: {
    select: { id: 'id', label: 'label' },
    prepare: ({ id, label }) => ({ title: label || id, subtitle: `#${id ?? ''}` }),
  },
});

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
  // Same as `anchor` above: a dialog instead of the inline popover, which was closing
  // on each keystroke while typing a URL.
  options: { modal: { type: 'dialog' } },
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
        annotations: [
          defineArrayMember({ type: 'link' }),
          defineArrayMember({ type: 'anchor', icon: AnchorIcon }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
  ],
});
