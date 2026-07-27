/**
 * The timeline content.
 *
 * The shape is deliberately flat and Sanity-friendly: one document per moment, with
 * the model reference carried as a plain path. When this moves to Sanity, `getMoments()`
 * becomes an async GROQ query returning the same `Moment[]`, and nothing downstream of
 * it has to change. A suggested schema lives at the bottom of this file.
 *
 * Resting model orientations are NOT here — they are a presentation concern, tuned by
 * eye rather than edited by an author, and live in lib/modelRotations.ts. They are
 * merged in by id below.
 */

import { restingRotation } from './modelRotations';

export type Moment = {
  /** Stable key — becomes the Sanity document `_id` / slug. */
  id: string;
  /** Short label rendered on the timeline, e.g. "2016" or "Spring 2020". */
  period: string;
  title: string;
  body: string;
  model: ModelSpec;
  /** Photos behind the section's Gallery button. Empty array = no gallery offered. */
  gallery: GalleryImage[];
};

export type GalleryImage = {
  src: string;
  alt: string;
};

/**
 * PLACEHOLDER imagery — generated SVGs under /public/images/gallery, there to prove the
 * slider at realistic aspect ratios. The `subject` strings describe the real story each
 * one now sits behind, so the alt text already reads correctly; only the pictures
 * themselves are stand-ins. Replace with real photography (or Sanity image refs) and
 * this helper goes away.
 */
function placeholderGallery(id: string, subject: string, count = 3): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/images/gallery/${id}-${i + 1}.svg`,
    alt: `${subject} — placeholder image ${i + 1} of ${count}`,
  }));
}

export type ModelSpec = {
  /** Path to a Draco-compressed .glb under /public/models. */
  url: string;
  /** Accessible description of what the model depicts. */
  alt: string;
  /** Resting orientation in radians. Set it in DEGREES in lib/modelRotations.ts. */
  rotation: [number, number, number];
  /** Multiplier on the auto-fit size, for models that read small or large in frame. */
  scale?: number;
};

/** A moment as authored — the rotation is attached afterwards, by id. */
type AuthoredMoment = Omit<Moment, 'model'> & { model: Omit<ModelSpec, 'rotation'> };

const AUTHORED: AuthoredMoment[] = [
  {
    id: 'fish-market',
    period: '1984—',
    title: 'Origin Story',
    body: 'When Eddie’s parents immigrated to New York City in 1984, they arrived with little more than hope, a few hundred dollars, and the kindness of friends who offered them a place to stay. His father found work where he could and eventually opened a small fish store in Astoria. It was neighbors—offering help, sharing meals, creating community—who made that path possible.',
    model: { url: '/models/fish-market.glb', alt: 'A city fish market stall' },
    gallery: placeholderGallery('fish-market', 'The original Astoria fish store'),
  },
  {
    id: 'korilla',
    period: '2008—',
    title: 'Korilla BBQ',
    body: 'Years later, Eddie started a Korean taco truck. No big plan—just good food. But the more he cooked, the more he saw how food could bring people together. Not just around flavors, but around stories, identities, and community. That little truck turned into a few restaurants, and then something bigger—a kitchen space for other food makers like us.',
    model: { url: '/models/korilla.glb', alt: 'The Korilla BBQ food truck' },
    gallery: placeholderGallery('korilla', 'The Korilla BBQ food truck'),
  },
  {
    id: 'cutting-board',
    period: '2019—',
    title: 'Communal Commissary',
    body: 'By 2019, we’d opened a shared commissary. A place for local entrepreneurs, immigrant cooks, and cultural communities to find space, support, and opportunity.',
    model: { url: '/models/cutting-board.glb', alt: 'A chef’s cutting board with prepared ingredients' },
    gallery: placeholderGallery('cutting-board', 'The shared commissary kitchen'),
  },
  {
    id: 'kommy-truck',
    period: '2020—',
    title: 'The Pandemic',
    body: 'Then the pandemic hit... And everything changed. We went from feeding customers to feeding the city. What started as a community kitchen became a frontline response. Thousands of meals turned into millions.',
    model: { url: '/models/kommy-truck.glb', alt: 'A Kommissary refrigerated delivery truck' },
    gallery: placeholderGallery('kommy-truck', 'Emergency meal distribution during the pandemic'),
  },
  {
    id: 'chicken',
    period: '2022—',
    title: 'Post-pandemic',
    body: 'As the pandemic began to wind down in 2022, we strengthened our position as the City’s problem solver. We expanded upon our stringent Quality Assurance procedures, formalized a Culinary Team, and established our headquarters in a 30,000-square-foot facility. NYC Health + Hospitals took notice, sparking our ongoing collaboration that began with 750,000 quarantine meals and testing kits.',
    model: { url: '/models/chicken.glb', alt: 'A roasted chicken dish' },
    gallery: placeholderGallery('chicken', 'Chef-crafted meals from the Culinary Team'),
  },
  {
    id: 'bananas-apple',
    period: '2023—',
    title: 'Asylum Seeker Crisis',
    body: 'Our partnership with NYC Health + Hospitals expanded in 2023 with the onset of the asylum seeker crisis. We helped build the Humanitarian Emergency Relief and Rescue Center (HERRC) program from scratch, and today, we manage operations at 11 sites where we provide food services to nearly 50,000 asylum seekers daily.',
    model: { url: '/models/bananas-apple.glb', alt: 'Fresh bananas and an apple' },
    gallery: placeholderGallery('bananas-apple', 'Food services for asylum seekers'),
  },
  {
    id: 'brownstones',
    period: '2024—',
    title: 'After-school Meals for DYCD',
    body: 'After winning a contract with the Department of Youth & Community Development, we began to provide meals for school children enrolled in after-school programs through the Department of Youth & Community Development. Through word of mouth, many other NYC schools heard about our services – and soon, this program expanded to encompass meal preparation, warehousing, and delivery to 280 NYC public schools and community centers.',
    model: { url: '/models/brownstones.glb', alt: 'A row of Brooklyn brownstones', scale: 1.1 },
    gallery: placeholderGallery('brownstones', 'Meals delivered to NYC public schools'),
  },
  {
    id: 'statue-of-liberty',
    period: 'Today & Tomorrow—',
    title: 'Evolving As NYC Evolves',
    body: 'Since then, our work has grown, but we’re still neighbors helping neighbors—showing up, cooking with love, and believing that caring for one another is one of the most powerful tools we have. Nothing falls outside what is “normal” for us: whether addressing immigration challenges, public health emergencies, or other community needs, we remain steadfast stewards of public trust. As we formalize our commitment to sustainable food practices—including sourcing from New York State farms and donating to local food pantries—we are also preparing to roll out a completely green fleet of vehicles and biodegradable packaging and utensils within the next year. Our reach extends far beyond the meals we serve, and we invite you to join us as we continue nourishing communities, empowering change, and shaping a future where access to nutritious food is a universal right for all. We look forward to serving you.',
    model: { url: '/models/statue-of-liberty.glb', alt: 'The Statue of Liberty' },
    gallery: placeholderGallery('statue-of-liberty', 'Kommissary serving New York City'),
  },
];

/**
 * Content joined to its resting rotations, once at module load. Doing it here rather
 * than inside getMoments() keeps object identity stable across calls, which is what
 * lets TimelineSection's registration effect depend on `moment.model` without
 * re-registering its slot on every render.
 */
const MOMENTS: Moment[] = AUTHORED.map((moment) => ({
  ...moment,
  model: { ...moment.model, rotation: restingRotation(moment.id) },
}));

/**
 * Reads the timeline. Synchronous today because the content is local; when it moves
 * to Sanity this becomes `async` and callers already `await` it.
 */
export async function getMoments(): Promise<Moment[]> {
  return MOMENTS;
}

/*
 * Suggested Sanity schema for `moment`:
 *
 *   defineType({
 *     name: 'moment',
 *     type: 'document',
 *     fields: [
 *       defineField({ name: 'period', type: 'string', validation: (r) => r.required() }),
 *       defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
 *       defineField({ name: 'body', type: 'text', rows: 6 }),
 *       defineField({ name: 'order', type: 'number' }),
 *       defineField({ name: 'model', type: 'file', options: { accept: '.glb' } }),
 *       defineField({ name: 'modelAlt', type: 'string' }),
 *       defineField({ name: 'modelScale', type: 'number', initialValue: 1 }),
 *     ],
 *   })
 *
 * GROQ: *[_type == "moment"] | order(order asc) {
 *   "id": _id, period, title, body,
 *   "model": { "url": model.asset->url, "alt": modelAlt, "scale": modelScale }
 * }
 *
 * Note there is no rotation field: posing a model is a design decision made against
 * the rendered page, not something an editor should be asked to supply in radians.
 * getMoments() keeps attaching it from lib/modelRotations.ts by id.
 */
