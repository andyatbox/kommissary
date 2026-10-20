import { WEEKLY_ENABLED } from './features';

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
  { id: 'what-we-do', label: 'Our Services', heading: 'Services and programs...' },
  { id: 'connect', label: 'Connect', heading: "Let's work together!" },
];

/** A nav link (from a Page or a hardcoded exception). */
export type NavLink = { text: string; href: string; column: number; order: number };

/**
 * Links that are NOT Page documents — pages living outside this project. They're
 * merged into their group (before the Page links) within the matching column.
 * (Our Story now exists as a real Page, so nothing here for now.)
 */
export const NAV_EXTRAS: Record<NavGroupId, NavLink[]> = {
  kommissary: [{ text: 'Home', href: '/', column: 2, order: 0 }],
  'what-we-do': [],
  connect: [],
};

// --- Built menu shape (what the header renders) ---

export type NavItem =
  | { kind: 'h2'; text: string }
  | { kind: 'link'; text: string; href: string };

/** A dropdown: column 1 is the fixed heading, columns 2 & 3 hold links. */
export type NavMenu = { id: NavGroupId; label: string; columns: NavItem[][] };

/** Nav-enabled pages, in the Pages list's drag order (which sets link order per column). */
export const NAV_QUERY = `*[_type == "page" && defined(navGroup)]|order(orderRank){
  navGroup,
  navColumn,
  title,
  "label": coalesce(navLabel, title),
  "href": slug.current
}`;

/** A Page as fetched (already ordered by the drag-orderable list) for nav building. */
export type NavPage = {
  navGroup: NavGroupId | null;
  navColumn: number | null;
  title?: string;
  label: string;
  /** Slug's `current`, no leading slash. */
  href: string | null;
};

/** Pages that appear in the nav: Weekly is paused (lib/features.ts), so its Page stays in
 *  Sanity but leaves the nav. */
const listed = (p: NavPage) => !!p.href && (WEEKLY_ENABLED || !/^\/?weekly(\/|$)/.test(p.href));
const toHref = (href: string) => (href.startsWith('/') ? href : `/${href}`);

/**
 * Build the three header dropdowns from Page documents. Pages arrive in list order
 * (orderRank), which becomes the link order within each column. Column 1 is always
 * the group's fixed heading; links land in column 2 or 3 per each page's `navColumn`.
 */
export function buildNav(pages: NavPage[]): NavMenu[] {
  return NAV_GROUPS.map((g) => {
    const pageLinks: NavLink[] = pages
      .filter((p) => p.navGroup === g.id && listed(p))
      .map((p, i) => ({
        text: p.label,
        href: toHref(p.href!),
        column: p.navColumn === 3 ? 3 : 2,
        order: i,
      }));

    const colItems = (col: number): NavItem[] =>
      [
        ...NAV_EXTRAS[g.id].filter((l) => l.column === col).sort((a, b) => a.order - b.order),
        ...pageLinks.filter((l) => l.column === col),
      ].map((l) => ({ kind: 'link' as const, text: l.text, href: l.href }));

    return {
      id: g.id,
      label: g.label,
      columns: [[{ kind: 'h2', text: g.heading }], colItems(2), colItems(3)],
    };
  });
}

/**
 * The nav's pages in reading order: dropdown by dropdown, column 2 then column 3, each in
 * the Pages list's order. (Home, a hardcoded extra, isn't a page to continue on to.)
 */
export function navSequence(pages: NavPage[]): { title: string; href: string }[] {
  const out: { title: string; href: string }[] = [];
  for (const g of NAV_GROUPS) {
    for (const col of [2, 3]) {
      for (const p of pages) {
        if (p.navGroup !== g.id || !listed(p) || (p.navColumn === 3 ? 3 : 2) !== col) continue;
        out.push({ title: p.title ?? p.label, href: toHref(p.href!) });
      }
    }
  }
  return out;
}

/** The page after `href` in the nav, wrapping from the last back to the first; null for
 *  a page that isn't in the nav. */
export function nextInNav(pages: NavPage[], href: string) {
  const seq = navSequence(pages);
  const i = seq.findIndex((s) => s.href === href);
  return i < 0 || seq.length < 2 ? null : seq[(i + 1) % seq.length];
}
