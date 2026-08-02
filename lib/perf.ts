/**
 * Adaptive quality. A tier is detected once, synchronously, before the Canvas
 * mounts (some settings — antialias, shader-level soft shadows — can't change
 * afterwards without an expensive rebuild). Runtime FPS then trims DPR within
 * the tier's range, so a machine that's merely busy degrades gracefully rather
 * than being locked to its opening guess.
 */

export type QualityTier = 0 | 1 | 2; // 0 = low, 1 = medium, 2 = high

export type Quality = {
  tier: QualityTier;
  /** True on phones / small touchscreens: forces the lightest settings AND swaps the
   *  WebGL gradient background for a CSS one, so only ONE WebGL context is ever live. */
  mobile: boolean;
  /** [min, max] device pixel ratio; runtime monitoring moves within this. */
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  softShadows: boolean;
  softSamples: number;
  /** Curve resolution of the extruded text — drives triangle count and load time. */
  curveSegments: number;
  /** Re-render the shadow map every N frames (1 = every frame). */
  shadowInterval: number;
};

// Note: tiers only ever trade *fidelity* (resolution, shadow detail, smoothness).
// They never remove content — every device shows the same models and words.

const PRESETS: Record<QualityTier, Omit<Quality, 'tier' | 'mobile'>> = {
  0: {
    // Never render below native (a sub-1 DPR upscales and looks soft/blocky), and
    // keep hardware MSAA on: smoothing edges costs far less than the extra pixels
    // a higher DPR would need, and jagged letter edges are the most visible artefact.
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    // The shadow frustum now follows the camera instead of blanketing the whole
    // sentence, so 2048 here resolves far finer than the old 4096 ever did — and
    // updating every frame is what removes the stepping/pulsing as things move.
    shadowMapSize: 2048,
    softShadows: false,
    softSamples: 0,
    curveSegments: 6,
    shadowInterval: 1,
  },
  1: {
    dpr: [1, 1.75],
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    // Softer, gently blurred shadow edges on top of everything tier 0 gets.
    softShadows: true,
    softSamples: 6,
    curveSegments: 8,
    shadowInterval: 1,
  },
  2: {
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    shadowMapSize: 3072,
    softShadows: true,
    softSamples: 10,
    curveSegments: 10,
    shadowInterval: 1,
  },
};

function readRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '') : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return '';
  }
}

/**
 * Phones and small touchscreens. Their GPUs aren't named by the desktop regexes below
 * (Adreno / Mali / Apple GPU), so without this they'd land at medium (tier 1) with soft
 * shadows — far too heavy. They're also where a second WebGL context (the gradient
 * background) most often exhausts the browser's context budget and crashes, so `mobile`
 * additionally routes the background to a CSS gradient. A coarse pointer with no fine
 * pointer is the reliable signal; a ≤820px screen is the belt-and-braces fallback.
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const coarseOnly =
    window.matchMedia?.('(pointer: coarse)').matches &&
    !window.matchMedia?.('(pointer: fine)').matches;
  const touch = (navigator.maxTouchPoints ?? 0) > 0 || 'ontouchstart' in window;
  const small = window.innerWidth <= 820;
  return Boolean((coarseOnly && touch) || (touch && small));
}

function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 1;

  // Manual override for testing: ?q=0 (low), 1 (medium), 2 (high).
  const forced = new URLSearchParams(window.location.search).get('q');
  if (forced === '0' || forced === '1' || forced === '2') {
    return Number(forced) as QualityTier;
  }

  // Phones always run the lightest tier regardless of core count — see isMobile().
  if (isMobile()) return 0;

  const cores = navigator.hardwareConcurrency ?? 4;
  // Chrome-family exposes RAM in GB (rounded down, capped at 8). ≤4GB can't hold this
  // many GLBs plus shadow maps without paging, so drop such machines to the low tier.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory <= 4) return 0;
  const renderer = readRenderer().toLowerCase();

  // Software rasterisers can't carry this scene at all.
  if (/swiftshader|llvmpipe|software|basic render/.test(renderer)) return 0;

  // Integrated Intel graphics — the common case on older MacBooks. Paired with a
  // Retina panel they're fill-rate bound long before they're geometry bound.
  if (/intel|hd graphics|iris|uhd/.test(renderer)) return 0;

  // Only award the top tier on hardware we can actually recognise as modern.
  // Anything else (e.g. an older discrete Radeon Pro) sits at medium and lets the
  // runtime monitor trim from there — core count alone is a poor proxy for GPU power.
  if (/apple m\d|rtx|radeon rx|arc a\d|geforce gtx 1[6-9]/.test(renderer)) return 2;

  if (cores <= 4) return 0;
  return 1;
}

let cached: Quality | null = null;

export function getQuality(): Quality {
  if (cached) return cached;
  const tier = detectTier();
  const mobile = isMobile();
  const preset = { ...PRESETS[tier] };
  if (mobile) {
    // On top of tier 0: keep DPR near native but no higher (phone panels are dense
    // enough that even 1.25 native is plenty), halve the shadow map, throttle the
    // shadow rebuild, and coarsen the text — every one of these is a per-frame GPU
    // saving on exactly the hardware that was hard-crashing.
    preset.dpr = [1, 1.25];
    preset.shadowMapSize = 1024;
    preset.shadowInterval = 2;
    preset.curveSegments = 5;
  }
  cached = { tier, mobile, ...preset };
  return cached;
}
