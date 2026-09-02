import type { HomeContent } from './store';

/**
 * Fallback homepage content — mirrors the original hardcoded site. Used if the Sanity
 * fetch returns nothing or fails, so the experience always renders.
 */
export const DEFAULT_CONTENT: HomeContent = {
  sentence:
    "We're Kommissary – a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.",
  typedLines: ['Food is a right.', 'Farm-fresh meals made right.', 'Right in New York City.'],
  pills: [
    {
      label: 'Our Story',
      words: ['Kommissary'],
      title: 'The Neighbor NYC Needs',
      body: [
        {
          _type: 'block',
          _key: 'kommissaryIntro',
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'kommissaryIntroText',
              marks: [],
              text:
                'From emergency food relief to late-night logistics, we\u2019re already here ' +
                'serving, solving, supporting. Through efficient operations, scalable ' +
                'infrastructure and people-centered partnerships, we deliver fresh meals, ' +
                'create local jobs, and support programs that bring dignity and care to ' +
                'every borough. Every day. For every New Yorker.',
            },
          ],
        },
      ],
      buttons: [{ label: 'OUR STORY', url: '/our-story' }],
    },
    { label: 'Food Is A Right', words: ['progressive,'], title: 'Food Is A Right' },
    { label: 'Our Team', words: ['minority-run'], title: 'Our Team' },
    { label: 'Bespoke Meals', words: ['chef-crafted', 'meals'], title: 'Bespoke Meals' },
    { label: 'Logistics', words: ['logistics', 'leader'], title: 'Logistics' },
    { label: 'Services', words: ['serving'], title: 'Services' },
    { label: 'Our Impact', words: ['communities'], title: 'Our Impact' },
    { label: 'Connect', words: ['New', 'York', 'City.'], title: 'Connect' },
  ],
};
