/**
 * The "Millions Served" figures, shown after the scrolling timeline. Same shape as
 * lib/timeline.ts's content — a flat array behind an async getter — so this can move
 * to Sanity the same way, later, without touching the component that renders it.
 */

export type Stat = {
  /** Rendered as the eyebrow. */
  year: string;
  /** Rendered as the headline figure — the unit ("Meals") is fixed, not per-row. */
  value: string;
};

const STATS: Stat[] = [
  { year: '2020', value: '1.5M' },
  { year: '2021', value: '4.3M' },
  { year: '2022', value: '5.1M' },
  { year: '2023', value: '19.1M' },
  { year: '2024', value: '35M+' },
];

export async function getStats(): Promise<Stat[]> {
  return STATS;
}

export type ParsedStat = {
  value: number;
  suffix: string;
  plus: boolean;
  /** Decimal places in the original figure — "19.1M" counts up with 1, "35M+" with 0. */
  decimals: number;
};

/**
 * Splits a figure like "19.1M" into its animatable number and its fixed decoration
 * ({ value: 19.1, suffix: 'M', plus: false, decimals: 1 }), so a count-up animation
 * can tick the number alone and re-append the rest for an exact match at rest.
 */
export function parseStatValue(raw: string): ParsedStat {
  const match = raw.match(/^([\d.]+)([^\d.+]*)(\+)?$/);
  if (!match) return { value: 0, suffix: raw, plus: false, decimals: 0 };
  const [, numStr, suffix, plus] = match;
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { value: parseFloat(numStr), suffix, plus: Boolean(plus), decimals };
}
