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
      of: [defineArrayMember({ type: 'block' })],
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

/** Singleton for the homepage 3D experience content. */
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'sentence',
      title: '3D sentence',
      type: 'text',
      rows: 3,
      description: 'The full message rendered as the snaking 3D word-stream.',
    }),
    defineField({
      name: 'pills',
      title: 'Pill buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'pill' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
});
