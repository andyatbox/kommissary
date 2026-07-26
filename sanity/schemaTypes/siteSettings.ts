import { defineField, defineType } from 'sanity';

/** Singleton for site-wide settings (metadata, etc.). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', initialValue: 'Kommissary' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
});
