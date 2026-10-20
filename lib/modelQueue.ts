import { useEffect, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * The homepage's 3D models and team photos, fetched in the order the camera meets them.
 *
 * Nothing here suspends, so the scene never waits on a model: the words (and scrolling)
 * are up as soon as the font is, and each model appears on its own once its file has
 * arrived. Whether it's then SHOWN is still up to its reveal (Models.tsx, PhoneModel.tsx),
 * which only brings a model in while its stop is on screen, so a model that finishes
 * after the camera has moved on stays hidden.
 *
 * Order: Models.tsx registers every asset with the stretch of the sentence (curve u)
 * where its stop is on screen, and the queue keeps a couple of downloads going, always
 * for the nearest stop not yet passed: the first phone, the fish market, the Korilla
 * truck… A stop the camera is in counts as ahead (its models are needed now), and only
 * once it has scrolled out of view does it count as passed. If you scroll past what's
 * loaded, it skips to what's now ahead; anything passed comes last (for scrolling back,
 * and the overview at the end).
 */

type Kind = 'gltf' | 'image';
type Asset = GLTF | THREE.Texture;
type Entry = {
  url: string;
  kind: Kind;
  /** Where on the sentence its stop comes on screen, and goes off again (curve u, 0–1). */
  u: number;
  until: number;
  status: 'idle' | 'loading' | 'done' | 'error';
  value: Asset | null;
  listeners: Set<() => void>;
};

/** Downloads at once: enough to keep the line busy, few enough that the next model in
 *  line isn't starved by ones further down the sentence. */
const CONCURRENCY = 2;
/** Must match the decoder files in public/draco. */
const DRACO_PATH = '/draco/';

const entries = new Map<string, Entry>();
let position = 0;
let loading = 0;
let gltf: GLTFLoader | null = null;
let texture: THREE.TextureLoader | null = null;

function gltfLoader() {
  if (!gltf) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_PATH);
    gltf = new GLTFLoader();
    gltf.setDRACOLoader(draco);
  }
  return gltf;
}

function entry(url: string, kind: Kind, u: number, until = u) {
  let e = entries.get(url);
  if (!e) {
    e = { url, kind, u, until, status: 'idle', value: null, listeners: new Set() };
    entries.set(url, e);
  } else {
    // Used in more than one place: needed from the first of them to the last.
    e.u = Math.min(e.u, u);
    e.until = Math.max(e.until, until);
  }
  return e;
}

/** The next download: the soonest stop not yet passed (the one on screen first), else the
 *  most recently passed. */
function next(): Entry | undefined {
  let best: Entry | undefined;
  let bestScore = Infinity;
  entries.forEach((e) => {
    if (e.status !== 'idle') return;
    const score = e.until >= position ? Math.max(0, e.u - position) : 2 + (position - e.until);
    if (score < bestScore) {
      bestScore = score;
      best = e;
    }
  });
  return best;
}

/** Dev only: `localStorage.setItem('kommissary:slowModels', '3000')` holds each model back
 *  that many ms, to see the scene with models still arriving. Removed from production. */
function devDelay(): number {
  if (process.env.NODE_ENV === 'production') return 0;
  try {
    return Number(window.localStorage.getItem('kommissary:slowModels')) || 0;
  } catch {
    return 0;
  }
}

/** Dev only: a timeline of the queue on `window.__modelQueue`, for checking load order. */
function log(event: string, e: Entry) {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
  const w = window as unknown as { __modelQueue?: { t: number; event: string; url: string; u: number }[] };
  (w.__modelQueue ??= []).push({ t: Math.round(performance.now()), event, url: e.url, u: +e.u.toFixed(3) });
  // (until isn't logged; u is enough to read the order)
}

function pump() {
  while (loading < CONCURRENCY) {
    const e = next();
    if (!e) return;
    e.status = 'loading';
    loading += 1;
    log('start', e);
    const delay = devDelay();
    const load = (): Promise<Asset> =>
      e.kind === 'gltf'
        ? gltfLoader().loadAsync(e.url)
        : (texture ??= new THREE.TextureLoader()).loadAsync(e.url);
    (delay ? new Promise((r) => setTimeout(r, delay)).then(load) : load())
      .then((value) => {
        e.status = 'done';
        e.value = value;
        log('done', e);
      })
      .catch((err) => {
        e.status = 'error';
        console.warn(`[models] couldn't load ${e.url}`, err);
      })
      .finally(() => {
        loading -= 1;
        e.listeners.forEach((l) => l());
        pump();
      });
  }
}

/** Register the scene's assets with where each one's stop is on screen (u to until);
 *  loading starts at once. */
export function queueAssets(items: { url: string; kind: Kind; u: number; until: number }[]) {
  for (const it of items) entry(it.url, it.kind, it.u, it.until);
  pump();
}

/** Where the camera is now (curve u), so the queue keeps loading what's next. */
export function setQueuePosition(u: number) {
  position = u;
  if (loading < CONCURRENCY) pump();
}

/**
 * A queued asset, or null until it has loaded (or if it failed). Never suspends.
 * An asset nobody registered yet is queued from wherever the camera is.
 */
export function useQueuedAsset<T extends Asset>(url: string | undefined, kind: Kind): T | null {
  useEffect(() => {
    if (!url) return;
    entry(url, kind, position);
    pump();
  }, [url, kind]);

  return useSyncExternalStore(
    (onChange) => {
      if (!url) return () => {};
      const e = entry(url, kind, position);
      e.listeners.add(onChange);
      return () => e.listeners.delete(onChange);
    },
    () => (url ? ((entries.get(url)?.value as T | null) ?? null) : null),
    () => null
  );
}
