import type { HomeContent } from './store';

/**
 * Fallback homepage content — mirrors the original hardcoded site. Used if the Sanity
 * fetch returns nothing or fails, so the experience always renders.
 */
export const DEFAULT_CONTENT: HomeContent = {
  sentence:
    "We're Kommissary—a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.",
  pills: [
    { label: 'Our Story', words: ['Kommissary—a'], title: 'Our Story' },
    { label: 'Food Is A Right', words: ['progressive,'], title: 'Food Is A Right' },
    { label: 'Our Team', words: ['minority-run'], title: 'Our Team' },
    { label: 'Bespoke Meals', words: ['chef-crafted', 'meals'], title: 'Bespoke Meals' },
    { label: 'Logistics', words: ['logistics', 'leader'], title: 'Logistics' },
    { label: 'Services', words: ['serving'], title: 'Services' },
    { label: 'Our Impact', words: ['communities'], title: 'Our Impact' },
    { label: 'Connect', words: ['New', 'York', 'City.'], title: 'Connect' },
  ],
};
