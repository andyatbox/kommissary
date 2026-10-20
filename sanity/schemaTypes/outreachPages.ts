import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Copy for the Nutrition Box (/bronx), Educators (/educator) and Community Leaders (/dycd)
 * pages, in English and Spanish.
 *
 * Every field is optional: anything left empty shows the page's built-in copy (each
 * page's components/<page>/copy.ts), and the field names here mirror that file so the two
 * line up one to one (lib/cmsCopy.tsx). Seeded with the built-in copy by
 * scripts/seed-outreach-pages.mts.
 *
 * Deliberately NOT here: the lead forms. Each form's questions map onto one Google Form's
 * entries, so they're changed in code alongside the Google Form, never separately.
 */

// --- English / Spanish pairs ----------------------------------------------------------

export const localeString = defineType({
  name: 'localeString',
  title: 'Text',
  type: 'object',
  options: { columns: 2 },
  fields: [
    defineField({ name: 'en', title: 'English', type: 'string' }),
    defineField({ name: 'es', title: 'Spanish', type: 'string' }),
  ],
});

export const localeText = defineType({
  name: 'localeText',
  title: 'Text',
  type: 'object',
  options: { columns: 2 },
  fields: [
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4 }),
    defineField({ name: 'es', title: 'Spanish', type: 'text', rows: 4 }),
  ],
});

// --- Shared pieces ----------------------------------------------------------------------

const PLACEHOLDERS = {
  getStarted: '{getStarted} = the “Get Started” button',
  callback: '{callback} = the “Request a Callback” button',
  phone: '{phone} = phone number link',
  email: '{email} = email link',
  somos: '{somos} = link to SOMOS',
};
const placeholders = (...keys: (keyof typeof PLACEHOLDERS)[]) =>
  `Placeholders, typed exactly as shown: ${keys.map((k) => PLACEHOLDERS[k]).join('; ')}.`;

const seo = defineField({
  name: 'seo',
  title: 'Search & sharing',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  description: 'Shown in search results and link previews. Leave empty to use the built-in text.',
  fields: [
    defineField({ name: 'title', title: 'Page title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
  ],
});

export const outreachFeature = defineType({
  name: 'outreachFeature',
  title: 'Feature',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      type: 'string',
      options: {
        list: [
          { title: 'Stethoscope', value: 'stethoscope' },
          { title: 'Pantry box', value: 'pantry-box' },
          { title: 'Apple on book', value: 'apple-on-book' },
          { title: 'Halal & kosher', value: 'halal-kosher' },
          { title: 'Delivery truck', value: 'delivery-truck' },
          { title: 'Bronx map pin', value: 'bronx-map-pin' },
        ],
      },
    }),
    defineField({ name: 'title', type: 'localeString' }),
    defineField({ name: 'copy', title: 'Description', type: 'localeText' }),
  ],
  preview: { select: { title: 'title.en', subtitle: 'icon' } },
});

export const outreachPoint = defineType({
  name: 'outreachPoint',
  title: 'Point',
  type: 'object',
  fields: [
    defineField({ name: 'big', title: 'Big word or number', type: 'localeString' }),
    defineField({ name: 'copy', title: 'Line under it', type: 'localeText', description: placeholders('somos') }),
    defineField({ name: 'wide', title: 'Wide tile', type: 'boolean', description: 'Takes half the row on desktop (used for the two stats).' }),
    defineField({ name: 'somos', title: 'SOMOS tile', type: 'boolean', description: 'The tile that links to SOMOS.' }),
  ],
  preview: { select: { title: 'big.en', subtitle: 'copy.en' } },
});

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Question',
  type: 'object',
  fields: [
    defineField({ name: 'q', title: 'Question', type: 'localeString' }),
    defineField({ name: 'a', title: 'Answer', type: 'localeText', description: placeholders('getStarted', 'phone', 'email', 'somos') }),
  ],
  preview: { select: { title: 'q.en', subtitle: 'a.en' } },
});

const section = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({ name, title, type: 'object', options: { collapsible: true, collapsed: true }, fields });

const features = section('features', 'Features', [
  defineField({ name: 'heading', type: 'localeString' }),
  defineField({ name: 'features', title: 'Features', type: 'array', of: [defineArrayMember({ type: 'outreachFeature' })] }),
]);

const points = (name: string, title: string) =>
  section(name, title, [
    defineField({ name: 'heading', type: 'localeString' }),
    defineField({ name: 'points', title: 'Points', type: 'array', of: [defineArrayMember({ type: 'outreachPoint' })] }),
  ]);

// --- Documents --------------------------------------------------------------------------

/** /bronx. A single document, id `nutritionBoxPage`. */
export const nutritionBoxPage = defineType({
  name: 'nutritionBoxPage',
  title: 'Nutrition Box page',
  type: 'document',
  fields: [
    seo,
    section('hero', 'Top of page', [
      defineField({
        name: 'headline',
        type: 'array',
        of: [defineArrayMember({ type: 'localeString' })],
        description: 'Two parts. The headline always breaks onto a new line between them.',
        validation: (rule) => rule.max(2),
      }),
      defineField({ name: 'intro', type: 'localeText' }),
    ]),
    features,
    section('howItWorks', 'How It Works', [
      defineField({ name: 'heading', type: 'localeString' }),
      defineField({ name: 'step', title: 'The word “Step”', type: 'localeString', description: 'Read aloud by screen readers before each step’s number.' }),
      defineField({
        name: 'steps',
        type: 'array',
        of: [defineArrayMember({ type: 'localeText' })],
        description: `Each step has a matching icon, so keep it to three. ${placeholders('getStarted')}`,
        validation: (rule) => rule.max(3),
      }),
      defineField({ name: 'help', title: 'Help line', type: 'localeText', description: placeholders('phone', 'email') }),
    ]),
    points('trust', 'A Trusted Neighbor'),
    section('faq', 'FAQ', [
      defineField({ name: 'heading', type: 'localeString' }),
      defineField({ name: 'faqs', title: 'Questions', type: 'array', of: [defineArrayMember({ type: 'faqItem' })] }),
      defineField({ name: 'ready', title: 'Line above the closing button', type: 'localeString' }),
    ]),
  ],
  preview: { prepare: () => ({ title: 'Nutrition Box', subtitle: '/bronx' }) },
});

/** /educator and /dycd: the same layout, one document each (ids `educatorPage`, `dycdPage`). */
export const partnerOutreachPage = defineType({
  name: 'partnerOutreachPage',
  title: 'Partner page',
  type: 'document',
  fields: [
    defineField({ name: 'internalName', title: 'Page', type: 'string', readOnly: true }),
    seo,
    section('hero', 'Top of page', [
      defineField({ name: 'headline', type: 'localeText' }),
      defineField({ name: 'intro', type: 'localeText' }),
    ]),
    features,
    points('qualifications', 'The Kommissary Impact'),
    section('letsConnect', 'Let’s Connect', [
      defineField({ name: 'heading', type: 'localeString' }),
      defineField({ name: 'intro', type: 'localeText', description: placeholders('callback') }),
      defineField({ name: 'help', type: 'localeText' }),
      defineField({ name: 'call', title: 'Label over the phone number', type: 'localeString' }),
      defineField({ name: 'email', title: 'Label over the email address', type: 'localeString' }),
    ]),
  ],
  preview: { select: { title: 'internalName' } },
});
