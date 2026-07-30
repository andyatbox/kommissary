/**
 * The timeline content and model helpers.
 *
 * Content is now authored in Sanity (the `moment` document type + the `ourStoryPage`
 * singleton). The array below is the local FALLBACK used only when Sanity is empty or
 * unreachable, so /our-story always renders. `momentFromSanity()` maps a fetched
 * document into the same `Moment` shape the components consume.
 *
 * Resting model orientations are NOT here — they are a presentation concern, tuned by
 * eye rather than edited by an author, and live in lib/story/modelRotations.ts. They
 * are keyed by MODEL (not moment), so a Sanity moment with a random id still resolves
 * the right pose from its chosen model.
 */

import { restingRotation } from './modelRotations';
import {
  galleryImagesFromSanity,
  type GalleryImage,
  type SanityGalleryImage,
} from '@/lib/galleryImage';

export type { GalleryImage } from '@/lib/galleryImage';

/** Gallery sizes hint for Our Story: the copy column (~two-thirds) at md+. */
const OUR_STORY_GALLERY_SIZES = '(min-width: 768px) 65vw, 100vw';

export type Moment = {
  /** Stable key — the Sanity document `_id`, or the fallback id below. */
  id: string;
  /** Short label rendered on the timeline, e.g. "2016" or "Spring 2020". */
  period: string;
  title: string;
  body: string;
  model: ModelSpec;
  /** Photos behind the section's Gallery button. Empty array = no gallery offered. */
  gallery: GalleryImage[];
};

export type ModelSpec = {
  /** Path to a Draco-compressed .glb under /public/models. */
  url: string;
  /** Accessible description of what the model depicts. */
  alt: string;
  /** Resting orientation in radians. Set it in DEGREES in lib/story/modelRotations.ts. */
  rotation: [number, number, number];
  /** Multiplier on the auto-fit size, for models that read small or large in frame. */
  scale?: number;
};

/** New moments default to this model until a bespoke one is sourced. */
export const DEFAULT_MODEL = 'statue-of-liberty';

/**
 * Alt text for each library model, keyed by its GLB file name (no extension) under
 * /public/models — the same keys used in the Sanity `model` dropdown and in
 * lib/story/modelRotations.ts. Adding a model means adding its GLB, an entry here, an
 * option in sanity/schemaTypes/moment.ts, and (optionally) a pose in modelRotations.ts.
 */
export const MODEL_ALTS: Record<string, string> = {
  'fish-market': 'A city fish market stall',
  korilla: 'The Korilla BBQ food truck',
  'cutting-board': 'A chef’s cutting board with prepared ingredients',
  'kommy-truck': 'A Kommissary refrigerated delivery truck',
  chicken: 'A roasted chicken dish',
  'bananas-apple': 'Fresh bananas and an apple',
  brownstones: 'A row of Brooklyn brownstones',
  'statue-of-liberty': 'The Statue of Liberty',
  ramen: 'A bowl of ramen',
  'lettuce-broccoli': 'Fresh lettuce and broccoli',
  mask: 'A protective face mask',
  desk: 'A work desk',
};

/** Builds a full ModelSpec (url + alt + resting rotation) from a model key. */
export function modelSpec(key: string, scale?: number): ModelSpec {
  const k = MODEL_ALTS[key] ? key : DEFAULT_MODEL;
  return {
    url: `/models/${k}.glb`,
    alt: MODEL_ALTS[k],
    rotation: restingRotation(k),
    scale,
  };
}

/**
 * Which model each moment shows — hard-set HERE, not in Sanity, keyed by the moment's
 * document id (stable across reordering). Newly authored moments (unknown id) fall back
 * to the default model. To change a moment's model, edit this map.
 */
const MOMENT_MODELS: Record<string, { key: string; scale?: number }> = {
  'moment-fish-market': { key: 'fish-market' },
  'moment-korilla': { key: 'korilla' },
  'moment-cutting-board': { key: 'cutting-board' },
  'moment-kommy-truck': { key: 'mask' },
  'moment-chicken': { key: 'chicken' },
  'moment-bananas-apple': { key: 'bananas-apple' },
  'moment-brownstones': { key: 'desk' },
  'moment-statue-of-liberty': { key: 'statue-of-liberty' },
};

/** Shape of a `moment` document as fetched by the /our-story GROQ query. The model is
 *  NOT read from Sanity — it's hard-set in MOMENT_MODELS above. */
export type SanityMoment = {
  id: string;
  period: string;
  title: string;
  body: string;
  gallery?: SanityGalleryImage[] | null;
};

/** Maps a fetched Sanity moment into the `Moment` shape the components render. */
export function momentFromSanity(m: SanityMoment): Moment {
  const model = MOMENT_MODELS[m.id] ?? { key: DEFAULT_MODEL };
  return {
    id: m.id,
    period: m.period,
    title: m.title,
    body: m.body,
    model: modelSpec(model.key, model.scale),
    gallery: galleryImagesFromSanity(m.gallery, OUR_STORY_GALLERY_SIZES),
  };
}

/**
 * PLACEHOLDER imagery for the local fallback only — generated SVGs under
 * /public/images/gallery. Sanity moments carry real uploaded photos instead.
 */
function placeholderGallery(id: string, subject: string, count = 3): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/images/gallery/${id}-${i + 1}.svg`,
    alt: `${subject} — placeholder image ${i + 1} of ${count}`,
  }));
}

/** A moment as authored locally — the model is given as a key + optional scale. */
type AuthoredMoment = Omit<Moment, 'model'> & { modelKey: string; modelScale?: number };

const AUTHORED: AuthoredMoment[] = [
  {
    id: 'fish-market',
    period: '1984—',
    title: 'Origin Story',
    body: 'When Eddie’s parents immigrated to New York City in 1984, they arrived with little more than hope, a few hundred dollars, and the kindness of friends who offered them a place to stay. His father found work where he could and eventually opened a small fish store in Astoria. It was neighbors—offering help, sharing meals, creating community—who made that path possible.',
    modelKey: 'fish-market',
    gallery: placeholderGallery('fish-market', 'The original Astoria fish store'),
  },
  {
    id: 'korilla',
    period: '2008—',
    title: 'Korilla BBQ',
    body: 'Years later, Eddie started a Korean taco truck. No big plan—just good food. But the more he cooked, the more he saw how food could bring people together. Not just around flavors, but around stories, identities, and community. That little truck turned into a few restaurants, and then something bigger—a kitchen space for other food makers like us.',
    modelKey: 'korilla',
    gallery: placeholderGallery('korilla', 'The Korilla BBQ food truck'),
  },
  {
    id: 'cutting-board',
    period: '2019—',
    title: 'Communal Commissary',
    body: 'By 2019, we’d opened a shared commissary. A place for local entrepreneurs, immigrant cooks, and cultural communities to find space, support, and opportunity.',
    modelKey: 'cutting-board',
    gallery: placeholderGallery('cutting-board', 'The shared commissary kitchen'),
  },
  {
    id: 'kommy-truck',
    period: '2020—',
    title: 'The Pandemic',
    body: 'Then the pandemic hit... And everything changed. We went from feeding customers to feeding the city. What started as a community kitchen became a frontline response. Thousands of meals turned into millions.',
    modelKey: 'mask',
    gallery: placeholderGallery('kommy-truck', 'Emergency meal distribution during the pandemic'),
  },
  {
    id: 'chicken',
    period: '2022—',
    title: 'Post-pandemic',
    body: 'As the pandemic began to wind down in 2022, we strengthened our position as the City’s problem solver. We expanded upon our stringent Quality Assurance procedures, formalized a Culinary Team, and established our headquarters in a 30,000-square-foot facility. NYC Health + Hospitals took notice, sparking our ongoing collaboration that began with 750,000 quarantine meals and testing kits.',
    modelKey: 'chicken',
    gallery: placeholderGallery('chicken', 'Chef-crafted meals from the Culinary Team'),
  },
  {
    id: 'bananas-apple',
    period: '2023—',
    title: 'Asylum Seeker Crisis',
    body: 'Our partnership with NYC Health + Hospitals expanded in 2023 with the onset of the asylum seeker crisis. We helped build the Humanitarian Emergency Relief and Rescue Center (HERRC) program from scratch, and today, we manage operations at 11 sites where we provide food services to nearly 50,000 asylum seekers daily.',
    modelKey: 'bananas-apple',
    gallery: placeholderGallery('bananas-apple', 'Food services for asylum seekers'),
  },
  {
    id: 'brownstones',
    period: '2024—',
    title: 'After-school Meals for DYCD',
    body: 'After winning a contract with the Department of Youth & Community Development, we began to provide meals for school children enrolled in after-school programs through the Department of Youth & Community Development. Through word of mouth, many other NYC schools heard about our services – and soon, this program expanded to encompass meal preparation, warehousing, and delivery to 280 NYC public schools and community centers.',
    modelKey: 'desk',
    gallery: placeholderGallery('brownstones', 'Meals delivered to NYC public schools'),
  },
  {
    id: 'statue-of-liberty',
    period: 'Today & Tomorrow—',
    title: 'Evolving As NYC Evolves',
    body: 'Since then, our work has grown, but we’re still neighbors helping neighbors—showing up, cooking with love, and believing that caring for one another is one of the most powerful tools we have. Nothing falls outside what is “normal” for us: whether addressing immigration challenges, public health emergencies, or other community needs, we remain steadfast stewards of public trust. As we formalize our commitment to sustainable food practices—including sourcing from New York State farms and donating to local food pantries—we are also preparing to roll out a completely green fleet of vehicles and biodegradable packaging and utensils within the next year. Our reach extends far beyond the meals we serve, and we invite you to join us as we continue nourishing communities, empowering change, and shaping a future where access to nutritious food is a universal right for all. We look forward to serving you.',
    modelKey: 'statue-of-liberty',
    gallery: placeholderGallery('statue-of-liberty', 'Kommissary serving New York City'),
  },
];

/** Object identity is stable across calls (built once), which lets TimelineSection's
 *  registration effect depend on `moment.model` without re-registering every render. */
const MOMENTS: Moment[] = AUTHORED.map(({ modelKey, modelScale, ...rest }) => ({
  ...rest,
  model: modelSpec(modelKey, modelScale),
}));

/** The local fallback timeline, used when Sanity returns no moments. */
export async function getMoments(): Promise<Moment[]> {
  return MOMENTS;
}
