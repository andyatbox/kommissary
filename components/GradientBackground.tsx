'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Site-wide animated background — an organic, slowly-morphing "lava lamp" gradient
 * between dark blue (#000666) and dark purple (#4b0043), drawn by a WebGL fragment
 * shader (domain-warped value noise), NOT a CSS gradient.
 *
 * Built with React-Three-Fiber rather than a hand-rolled WebGL context: the raw context
 * was crashing on some machines (white / broken-canvas icon), whereas R3F manages
 * context creation, loss and cleanup robustly. `powerPreference: 'high-performance'`
 * MATCHES the 3D scenes so a dual-GPU browser can't split the two contexts across GPUs
 * (which crashes compositing). The `<color>` background is an opaque navy floor, so a
 * failed frame is navy, never white.
 *
 * ── Cost ────────────────────────────────────────────────────────────────────────
 * This runs on every page, alongside the homepage's 3D scene, so the frame RATE is what's
 * cut rather than the image: it renders on demand at BACKGROUND_FPS instead of every
 * frame. The morph is very slow (see the uTime scale below), so this is imperceptible and
 * costs well under half as much.
 *
 * The shader itself is deliberately left alone. Cheapening it — a fract() hash in place of
 * sin(), or three octaves instead of four — does save a lot per pixel, but it visibly
 * coarsens the gradient into larger, flatter blobs. Not worth it; the look is the point.
 */

/** Redraws per second. The animation is slow enough that this reads as continuous. */
const BACKGROUND_FPS = 24;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0); // position is already an NDC fullscreen quad
}
`;

const fragmentShader = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.0 + vec2(3.1, 1.7); a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vUv;
  p.x *= max(uRes.x, 1.0) / max(uRes.y, 1.0); // aspect-correct so shapes stay round
  p *= 1.1;
  float t = uTime * 0.085;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(4.3, -t * 0.8)));
  vec2 r = vec2(
    fbm(p + 1.6 * q + vec2(1.2, 7.4) + t * 0.5),
    fbm(p + 1.6 * q + vec2(8.7, 2.1) - t * 0.4)
  );
  float f = smoothstep(0.25, 0.78, fbm(p + 1.6 * r));

  vec3 navy   = vec3(0.000, 0.024, 0.400); // #000666
  vec3 purple = vec3(0.294, 0.000, 0.263); // #4b0043
  vec3 col = mix(navy, purple, f);
  col += smoothstep(0.6, 1.0, f) * vec3(0.10, 0.0, 0.12); // subtle glow in the purple cores

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function GradientPlane({ onReady }: { onReady: () => void }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size, invalidate } = useThree();
  const shown = useRef(false);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } }),
    []
  );

  // The canvas only draws when asked (frameloop="demand"), so drive it on a timer
  // instead of every animation frame. uTime still comes from the real clock, so the
  // morph runs at the same speed — it's just sampled less often.
  useEffect(() => {
    const id = window.setInterval(invalidate, 1000 / BACKGROUND_FPS);
    return () => window.clearInterval(id);
  }, [invalidate]);

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uRes.value.set(size.width, size.height);
    // Signal ready once the first frame has actually drawn, so the fade-in reveals the
    // gradient rather than a blank frame.
    if (!shown.current) {
      shown.current = true;
      onReady();
    }
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function GradientBackground() {
  // Fade the canvas up once the first frame has drawn, so it eases out of the flat
  // #000666 (on <html>) instead of popping in.
  const [ready, setReady] = useState(false);
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[1500ms] ease-out ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Canvas
        // Draws only when invalidated — see the timer in GradientPlane.
        frameloop="demand"
        dpr={0.5}
        gl={{ antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Opaque navy floor so any failed/blank frame is navy, never white. */}
        <color attach="background" args={['#000666']} />
        <GradientPlane onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
}
