// Which ad brought a visitor to /bronx, for the response spreadsheet's "Source" column.
//
// Meta ads link here with ?src=<creative variant>, e.g. ?lang=es&src=c1A (campaign 1,
// variant A). The variant is remembered on this device, so it's still credited if they
// look around the site, or leave and come back, before filling in the form; it's sent
// with the form, then forgotten. A newer ad link replaces it. No src: Source stays blank.
//
// Only short codes are kept (letters, digits, - and _), so nothing else a link carries
// can reach the spreadsheet.

const STORAGE_KEY = 'nutrition-box-ad-source';
/** How long an ad click is credited without a form being sent. */
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

function clean(value: string | null): string | null {
  const v = value?.trim() ?? '';
  return /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : null;
}

/** On page load: remembers ?src= from the address, if it has one. */
export function rememberAdSource() {
  const src = clean(new URLSearchParams(window.location.search).get('src'));
  if (!src) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ src, at: Date.now() }));
  } catch {
    // Storage blocked (private browsing): the address still has it while they're here.
  }
}

/** The variant to credit: this address's ?src=, else the one remembered (if recent). */
export function adSource(): string {
  const fromUrl = clean(new URLSearchParams(window.location.search).get('src'));
  if (fromUrl) return fromUrl;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as { src?: string; at?: number } | null;
    if (saved?.src && saved.at && Date.now() - saved.at < KEEP_MS) return clean(saved.src) ?? '';
  } catch {
    // Nothing usable remembered.
  }
  return '';
}

/** After the form is sent: the next request isn't credited to this ad again. */
export function forgetAdSource() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
