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

const PRESETS: Record<QualityTier, Omit<Quality, 'tier'>> = {
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

function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 1;

  // Manual override for testing: ?q=0 (low), 1 (medium), 2 (high).
  const forced = new URLSearchParams(window.location.search).get('q');
  if (forced === '0' || forced === '1' || forced === '2') {
    return Number(forced) as QualityTier;
  }

  const cores = navigator.hardwareConcurrency ?? 4;
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
  cached = { tier, ...PRESETS[tier] };
  return cached;
}
