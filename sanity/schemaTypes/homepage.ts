import { defineArrayMember, defineField, defineType } from 'sanity';

/** A 3D pill button that floats above word(s) in the sentence. */
export const pill = defineType({
  name: 'pill',
  title: 'Pill button',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'URL / path', type: 'string' }),
    defineField({
      name: 'words',
      title: 'Anchor words',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'The word(s) in the sentence this pill floats above. Must match the sentence exactly (including punctuation), e.g. "chef-crafted".',
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
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
    defineField({
      name: 'endHeading',
      title: 'End-screen lines',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Each entry is one line of the closing call-to-action.',
    }),
    defineField({ name: 'endLinkText', title: 'End-screen link text', type: 'string' }),
    defineField({ name: 'endLinkHref', title: 'End-screen link URL', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
});
