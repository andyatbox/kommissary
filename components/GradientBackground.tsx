'use client';

import { useEffect, useRef } from 'react';

/**
 * Site-wide animated background — an organic, slowly-morphing "lava lamp" gradient
 * between dark blue (#000666) and dark purple (#4b0043), drawn with a WebGL fragment
 * shader (domain-warped value noise), NOT a CSS gradient.
 *
 * Cheap and defensive so it can't tax the GPU or interfere with the R3F scenes:
 *   - one fullscreen triangle, highp shader, HALF resolution, ~30fps, paused when hidden;
 *   - NO powerPreference hint — matching the R3F 'high-performance' hint would be fine
 *     too, but requesting a *different* one ('low-power') can make a dual-GPU browser put
 *     the two contexts on separate GPUs and crash compositing;
 *   - shader compile/link is verified, resolution is clamped away from zero (a 0 divide
 *     yields NaN → a white frame), and any failure hides the canvas so the body's solid
 *     #000666 shows instead of a broken-canvas icon.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
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
  vec2 res = max(uRes, vec2(1.0));       // never divide by zero (→ NaN → white)
  vec2 uv = gl_FragCoord.xy / res;
  vec2 p = uv;
  p.x *= res.x / res.y;                   // aspect-correct so shapes stay round
  p *= 1.6;
  float t = uTime * 0.04;                 // slow drift

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(4.3, -t * 0.8)));
  vec2 r = vec2(
    fbm(p + 1.8 * q + vec2(1.2, 7.4) + t * 0.5),
    fbm(p + 1.8 * q + vec2(8.7, 2.1) - t * 0.4)
  );
  float f = clamp(fbm(p + 1.8 * r) * 1.15, 0.0, 1.0);

  vec3 navy   = vec3(0.000, 0.024, 0.400); // #000666
  vec3 indigo = vec3(0.120, 0.010, 0.380); // blue-purple midpoint
  vec3 purple = vec3(0.294, 0.000, 0.263); // #4b0043
  vec3 col = f < 0.5 ? mix(navy, indigo, f * 2.0) : mix(indigo, purple, (f - 0.5) * 2.0);
  col *= 0.88 + 0.24 * r.x;                // gentle depth variation

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const SCALE = 0.5; // half resolution — soft gradient hides it, 1/4 the fragments
const FRAME_MS = 1000 / 30; // ~30fps

export default function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let gl: WebGLRenderingContext | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let start = performance.now();
    let last = 0;

    const compile = (type: number, src: string): WebGLShader | null => {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.warn('GradientBackground shader compile error:', gl!.getShaderInfoLog(s));
        gl!.deleteShader(s);
        return null;
      }
      return s;
    };

    const setup = (): boolean => {
      gl = canvas.getContext('webgl', {
        alpha: true, // failure/no-draw shows the navy body behind, never white/black
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      });
      if (!gl) return false;

      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;

      const program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('GradientBackground link error:', gl.getProgramInfoLog(program));
        return false;
      }
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      uRes = gl.getUniformLocation(program, 'uRes');
      uTime = gl.getUniformLocation(program, 'uTime');
      gl.clearColor(0.0, 0.024, 0.4, 1.0); // navy, in case a frame ever fails to cover
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
      if (uRes) gl.uniform2f(uRes, w, h);
    };

    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden || !gl || gl.isContextLost()) return;
      if (now - last < FRAME_MS) return;
      last = now;
      if (uTime) gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onLost = (e: Event) => {
      e.preventDefault(); // allow a restore instead of the browser's broken-canvas icon
      cancelAnimationFrame(raf);
    };
    const onRestored = () => {
      if (disposed) return;
      if (setup()) {
        resize();
        start = performance.now();
        last = 0;
        raf = requestAnimationFrame(frame);
      } else {
        canvas.style.display = 'none';
      }
    };

    if (!setup()) {
      canvas.style.display = 'none'; // no white / no broken icon — body #000666 shows
      return;
    }
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
