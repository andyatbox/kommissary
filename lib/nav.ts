/**
 * Header navigation config. The three dropdowns and their column-1 headings are
 * fixed here; the links inside each are built from Page documents whose `navGroup`
 * matches the group id (plus any non-Page exceptions below, e.g. Our Story, which
 * lives in another project). Group ids must match the Page schema's navGroup values.
 */

export type NavGroupId = 'kommissary' | 'what-we-do' | 'connect';

export type NavGroup = {
  id: NavGroupId;
  label: string;
  /** The hard-set h2 shown in column 1 of this dropdown. */
  heading: string;
};

export const NAV_GROUPS: NavGroup[] = [
  { id: 'kommissary', label: 'Kommissary', heading: 'Who we are...' },
  { id: 'what-we-do', label: 'What we do', heading: 'What we do...' },
  { id: 'connect', label: 'Connect', heading: "Let's work together!" },
];

/** A nav link (from a Page or a hardcoded exception). */
export type NavLink = { text: string; href: string; column: number; order: number };

/**
 * Links that are NOT Page documents — pages living outside this project. They're
 * merged into their group alongside the Page-derived links.
 */
export const NAV_EXTRAS: Record<NavGroupId, NavLink[]> = {
  kommissary: [{ text: 'Our Story & Timeline', href: '/our-story', column: 2, order: 0 }],
  'what-we-do': [],
  connect: [],
};
