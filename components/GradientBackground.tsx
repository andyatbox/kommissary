'use client';

import { useEffect, useRef } from 'react';

/**
 * Site-wide animated background — an organic, slowly-morphing "lava lamp" gradient
 * between dark blue (#000666) and dark purple (#4b0043), drawn with a WebGL fragment
 * shader (domain-warped value noise), NOT a CSS gradient.
 *
 * Deliberately cheap and isolated so it can't tax the GPU or interfere with the R3F
 * scenes (homepage / Our Story), which run in their own contexts:
 *   - its own low-power WebGL context, one fullscreen triangle, a mediump shader;
 *   - rendered at half resolution (the diffuse look hides it) — a quarter of the pixels;
 *   - throttled to ~30fps and paused entirely while the tab is hidden;
 *   - a single draw call per frame, no per-frame allocations.
 * If WebGL is unavailable it renders nothing and the body's solid #000666 shows through.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.0 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y; // correct aspect so blobs stay round
  p *= 1.6;
  float t = uTime * 0.04; // slow drift

  // Two-level domain warp → organic, diffuse shapes.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(4.3, -t * 0.8)));
  vec2 r = vec2(
    fbm(p + 1.8 * q + vec2(1.2, 7.4) + t * 0.5),
    fbm(p + 1.8 * q + vec2(8.7, 2.1) - t * 0.4)
  );
  float f = clamp(fbm(p + 1.8 * r) * 1.15, 0.0, 1.0);

  vec3 navy   = vec3(0.000, 0.024, 0.400); // #000666
  vec3 indigo = vec3(0.120, 0.010, 0.380); // a blue-purple midpoint
  vec3 purple = vec3(0.294, 0.000, 0.263); // #4b0043
  vec3 col = f < 0.5 ? mix(navy, indigo, f * 2.0) : mix(indigo, purple, (f - 0.5) * 2.0);
  col *= 0.88 + 0.24 * r.x; // gentle depth variation

  gl_FragColor = vec4(col, 1.0);
}
`;

/** Half-resolution: the gradient is soft, so this is visually identical for 1/4 the work. */
const SCALE = 0.5;
/** ~30fps — plenty for a slow lava lamp; halves the render load vs. the display refresh. */
const FRAME_MS = 1000 / 30;

export default function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let start = performance.now();
    let last = 0;

    const compile = (type: number, src: string) => {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    };

    const setup = () => {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      });
      if (!gl) return false;

      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      // One fullscreen triangle (covers the viewport, one primitive).
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      uRes = gl.getUniformLocation(program, 'uRes');
      uTime = gl.getUniformLocation(program, 'uTime');
      return true;
    };

    const resize = () => {
      if (!gl) return;
      const w = Math.max(2, Math.floor(window.innerWidth * SCALE));
      const h = Math.max(2, Math.floor(window.innerHeight * SCALE));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };

    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden || !gl) return;
      if (now - last < FRAME_MS) return;
      last = now;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
    };
    const onRestored = () => {
      if (disposed) return;
      if (setup()) {
        resize();
        start = performance.now();
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    if (!setup()) return; // no WebGL → body #000666 shows through
    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('webglcontextlost', onLost as EventListener);
    canvas.addEventListener('webglcontextrestored', onRestored);
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
