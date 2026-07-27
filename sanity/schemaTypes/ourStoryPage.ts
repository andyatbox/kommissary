import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Page-level content for /our-story that isn't a timeline Moment: the opening heading
 * and the closing "Millions Served" figures. The moments themselves are separate,
 * drag-orderable `moment` documents. Singleton — edited in place, never listed.
 */
export const ourStoryPage = defineType({
  name: 'ourStoryPage',
  title: 'Our Story Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page heading',
      type: 'string',
      initialValue: 'Our Story & Timeline',
      description: 'The large heading at the top of the page.',
    }),
    defineField({
      name: 'statsHeading',
      title: 'Stats section heading',
      type: 'string',
      initialValue: 'Millions Served',
      description: 'Heading of the closing count-up section.',
    }),
    defineField({
      name: 'statsUnit',
      title: 'Stats unit label',
      type: 'string',
      initialValue: 'Meals',
      description: 'The fixed label under each figure, e.g. "Meals".',
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description: 'Yearly totals, shown left to right. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({
              name: 'year',
              type: 'string',
              description: 'The eyebrow, e.g. "2024".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'The figure that counts up, e.g. "19.1M" or "35M+".',
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'year' },
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Our Story Page' }) },
});
