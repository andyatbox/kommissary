import { defineArrayMember, defineField, defineType } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

/**
 * The models available to a moment. Each `value` is the file name (no extension) of a
 * Draco-compressed GLB under /public/models. Resting orientation for each is tuned by
 * eye in lib/story/modelRotations.ts (keyed by the same value), so it is not an
 * editor-facing field. When a bespoke model is sourced, add its GLB and an option here.
 */
export const MODEL_OPTIONS = [
  { title: 'Statue of Liberty', value: 'statue-of-liberty' },
  { title: 'Fish Market', value: 'fish-market' },
  { title: 'Korilla Truck', value: 'korilla' },
  { title: 'Cutting Board', value: 'cutting-board' },
  { title: 'Kommy Delivery Truck', value: 'kommy-truck' },
  { title: 'Roast Chicken', value: 'chicken' },
  { title: 'Bananas & Apple', value: 'bananas-apple' },
  { title: 'Brownstones', value: 'brownstones' },
  { title: 'Ramen', value: 'ramen' },
  { title: 'Lettuce & Broccoli', value: 'lettuce-broccoli' },
  { title: 'Face Mask', value: 'mask' },
];

export const moment = defineType({
  name: 'moment',
  title: 'Timeline Moment',
  type: 'document',
  // Drag-to-reorder in the Moments list sets the order they appear down the timeline.
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'moment' }),
    defineField({
      name: 'period',
      title: 'Period',
      type: 'string',
      description: 'The eyebrow on the timeline, e.g. "1984—" or "Today & Tomorrow—".',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 6,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'model',
      title: '3D Model',
      type: 'string',
      initialValue: 'statue-of-liberty',
      description: 'The floating model beside this moment. Defaults to the Statue of Liberty until a bespoke model is sourced.',
      options: { list: MODEL_OPTIONS },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'modelScale',
      title: 'Model scale',
      type: 'number',
      description: 'Optional multiplier if the model reads small or large in frame. Leave blank for the default (1).',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      description: 'Photos shown behind this moment’s Gallery button. Leave empty to hide the gallery.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'Describes the photo for screen readers.',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', period: 'period', model: 'model' },
    prepare: ({ title, period, model }) => ({
      title,
      subtitle: [period, model].filter(Boolean).join('   ·   '),
    }),
  },
});
