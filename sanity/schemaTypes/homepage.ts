import { defineArrayMember, defineField, defineType } from 'sanity';

/** A button shown inside a pill's content overlay (under the body copy). */
export const ctaButton = defineType({
  name: 'ctaButton',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'url',
      title: 'URL / path',
      type: 'string',
      description: 'Where the button links (opens in the same window).',
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'url' } },
});

/**
 * A 3D pill button that floats above word(s) in the sentence. Clicking it zooms in
 * and overlays the title/body/buttons defined here.
 */
export const pill = defineType({
  name: 'pill',
  title: 'Pill button',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'words',
      title: 'Anchor words',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'The word(s) in the sentence this pill floats above. Must match the sentence exactly (including punctuation), e.g. "chef-crafted".',
    }),
    defineField({
      name: 'title',
      title: 'Overlay title',
      type: 'string',
      description: 'Heading (h2) shown in the content overlay when this pill is clicked.',
    }),
    defineField({
      name: 'body',
      title: 'Overlay body',
      type: 'array',
      // A bare `{ type: 'block' }` falls back to Sanity's default annotations, whose link
      // type is re-resolved on every keystroke — which closes the link-edit popover as you
      // type the URL. Reference the named `link` type instead (same fix as blockContent).
      // Marks/styles are limited to what the pill overlay (Modal.tsx) actually renders:
      // paragraphs, lists, strong/em, and links.
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
            annotations: [defineArrayMember({ type: 'link' })],
          },
        }),
      ],
      description: 'Body copy shown under the title.',
    }),
    defineField({
      name: 'buttons',
      title: 'Buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'ctaButton' })],
      description: 'Optional buttons shown under the body — rendered inline, centered, spaced.',
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'title' } },
});

/** Reusable definition for one of the five "Our Team" photos. */
const teamPhoto = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'image',
    fieldset: 'team',
    options: { hotspot: true },
    description: 'Photo for this position in the on-screen cluster. Leave empty to hide this plane.',
  });

/** Singleton for the homepage 3D experience content. */
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fieldsets: [
    {
      name: 'team',
      title: 'Our Team photos',
      description:
        'The five photos that float around the word “minority-run”. Each is labelled by its position in the on-screen cluster.',
      options: { collapsible: true, collapsed: false, columns: 2 },
    },
  ],
  fields: [
    defineField({
      name: 'sentence',
      title: '3D sentence',
      type: 'text',
      rows: 3,
      description:
        'This is the 3D sentence that the camera follows. Many of the words have 3D models, CTAs, and overlayed content attached directly to them. If removed, we\'ll lose all that. Consult Andy before editing.',
    }),
    defineField({
      name: 'typedLines',
      title: 'Landing tagline lines',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'Typed out one at a time above the logo on the landing screen, then rewound and replaced by the next, looping. Drag to reorder.',
    }),
    defineField({
      name: 'endCta',
      title: 'End-screen call to action',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          // One plain paragraph with links — it's styled as a single heading on screen,
          // so headings, lists and quotes would have nowhere sensible to render.
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [],
            annotations: [defineArrayMember({ type: 'link' })],
          },
        }),
      ],
      description:
        'Shown above the logo once the camera pulls out at the end. Highlight words and use the link button to point them at pages. Leave empty for the built-in copy.',
    }),
    defineField({
      name: 'pills',
      title: 'Pill buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'pill' })],
    }),
    teamPhoto('teamTopLeft', 'Top left'),
    teamPhoto('teamTopRight', 'Top right'),
    teamPhoto('teamBottomLeft', 'Bottom left'),
    teamPhoto('teamBottomCenter', 'Bottom center'),
    teamPhoto('teamBottomRight', 'Bottom right'),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
});
