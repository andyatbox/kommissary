import * as THREE from 'three';

/**
 * The Our Impact slider's pictures: one full-screen plane per slide in an orthographic
 * scene measured in CSS px, so a plane's x is exactly its slide's offset on screen.
 *
 * Each plane's shader does three things:
 * - Cover: crops the image to the screen's shape around its hotspot, like object-cover.
 * - Parallax: the image is zoomed in slightly and slid against its plane, so it travels
 *   slower than its frame and appears set back inside it.
 * - RGB shift: red and green are sampled behind blue along the direction of travel, so
 *   the colours trail apart with speed and land back in register at rest.
 * - Cursor: around the mouse the colours split outward from it, with a slight lens pull,
 *   fading to nothing a little under half a screen away; and the whole picture drifts a
 *   touch against the cursor. Both are driven to zero on touch screens (see frame).
 *
 * It draws only when something changed (see frame), so a settled slider costs nothing.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uImage;
  uniform vec2 uPlane;
  uniform vec2 uFocus;
  uniform float uProgress;
  uniform float uParallax;
  uniform float uZoom;
  uniform float uShift;
  uniform float uReveal;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uAspect;
  uniform vec2 uLook;
  varying vec2 vUv;

  const vec3 NAVY = vec3(0.0, 6.0 / 255.0, 102.0 / 255.0);
  // The cursor's reach, in screen heights, and its split and lens pull at full strength.
  const float HOVER_RADIUS = 0.45;
  const float HOVER_SPLIT = 0.03;
  const float HOVER_LENS = 0.012;

  vec2 cover(vec2 uv) {
    float planeRatio = uPlane.x / uPlane.y;
    float imageRatio = uImage.x / uImage.y;
    vec2 s = planeRatio > imageRatio ? vec2(1.0, imageRatio / planeRatio) : vec2(planeRatio / imageRatio, 1.0);
    return (uv - 0.5) * s + 0.5 + (uFocus - 0.5) * (1.0 - s);
  }

  void main() {
    // This pixel on screen (0-1, y up; the plane sits uProgress widths off centre) and
    // its distance from the cursor in screen heights. Strength eases to exactly zero at
    // HOVER_RADIUS, and is zero at the cursor itself (no direction there).
    vec2 toMouse = vec2(vUv.x + uProgress, vUv.y) - uMouse;
    toMouse.x *= uAspect;
    float dist = length(toMouse);
    float near = 1.0 - smoothstep(0.0, HOVER_RADIUS, dist);
    float k = uHover * near * near;
    vec2 dir = dist > 1e-4 ? toMouse / dist : vec2(0.0);
    dir.x /= uAspect;

    vec2 uv = (vUv - 0.5) / uZoom + 0.5;
    uv.x += uProgress * uParallax;
    uv += uLook;
    uv -= dir * k * HOVER_LENS;
    uv = cover(uv);

    vec2 d = vec2(uShift, 0.0);
    vec2 h = dir * k * HOVER_SPLIT;
    vec3 color = vec3(
      texture2D(uTex, uv - d - h).r,
      texture2D(uTex, uv - d * 0.5).g,
      texture2D(uTex, uv + h).b
    );
    gl_FragColor = vec4(mix(NAVY, color, uReveal), 1.0);
  }
`;

/** Image zoom inside its plane: the slack the parallax moves through. */
export const ZOOM = 1.2;
/** Parallax travel at one slide's distance, in zoomed-image widths. With LOOK it must
 *  stay within 0.5 - 0.5/ZOOM (0.083 at 1.2), or the image's edge would show. */
export const PARALLAX = 0.07;
/** The cursor's pull on the picture at the screen's edge, in zoomed-image widths. */
export const LOOK = 0.012;
/** Fade-in once a picture has loaded, ms. */
const REVEAL_MS = 900;

export type GLSlide = { url: string | null; focus: [number, number] };

/** Per-frame effect state from the slider. */
export type GLEffects = {
  /** Scroll RGB split, in image widths. */
  shift: number;
  /** Cursor position on screen, 0-1 with y up. */
  mouseX: number;
  mouseY: number;
  /** Cursor effect strength, 0-1 (always 0 on touch). */
  hover: number;
  /** Picture offset from the cursor, in zoomed-image widths. */
  lookX: number;
  lookY: number;
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class ImpactGL {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  private meshes: THREE.Mesh[] = [];
  private materials: THREE.ShaderMaterial[] = [];
  private textures: THREE.Texture[] = [];
  /** When each picture started fading in (null until it loads). */
  private revealAt: (number | null)[] = [];
  private dirty = true;
  private w = 1;

  /** Throws if WebGL isn't available; the slider then falls back to plain images. */
  constructor(canvas: HTMLCanvasElement, slides: GLSlide[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000666, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const geometry = new THREE.PlaneGeometry(1, 1);
    const blank = new THREE.DataTexture(new Uint8Array([0, 6, 102, 255]), 1, 1);
    blank.needsUpdate = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    slides.forEach((slide, i) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uTex: { value: blank },
          uImage: { value: new THREE.Vector2(1, 1) },
          uPlane: { value: new THREE.Vector2(1, 1) },
          // Sanity's hotspot is measured from the top; texture v runs from the bottom.
          uFocus: { value: new THREE.Vector2(slide.focus[0], 1 - slide.focus[1]) },
          uProgress: { value: 0 },
          uParallax: { value: PARALLAX },
          uZoom: { value: ZOOM },
          uShift: { value: 0 },
          uReveal: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uHover: { value: 0 },
          uAspect: { value: 1 },
          uLook: { value: new THREE.Vector2(0, 0) },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.materials.push(material);
      this.revealAt.push(null);

      if (slide.url) {
        loader.load(slide.url, (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          const img = texture.image as { width: number; height: number };
          material.uniforms.uTex.value = texture;
          material.uniforms.uImage.value.set(img.width, img.height);
          this.textures.push(texture);
          this.revealAt[i] = performance.now();
          this.dirty = true;
        });
      }
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.renderer.setSize(w, h, false);
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    for (const mesh of this.meshes) mesh.scale.set(w, h, 1);
    for (const m of this.materials) {
      m.uniforms.uPlane.value.set(w, h);
      m.uniforms.uAspect.value = w / h;
    }
    this.dirty = true;
  }

  /**
   * xs: each slide's x offset in px (0 = filling the screen). Draws only if something
   * changed (`changed`: the slides or an effect), a picture is fading in, or the canvas
   * was resized.
   */
  frame(now: number, xs: number[], fx: GLEffects, changed: boolean) {
    let fading = false;
    this.materials.forEach((m, i) => {
      const at = this.revealAt[i];
      const r = at === null ? 0 : Math.min(1, (now - at) / REVEAL_MS);
      if (at !== null && r < 1) fading = true;
      m.uniforms.uReveal.value = easeOut(r);
    });
    if (!changed && !fading && !this.dirty) return;
    this.dirty = false;

    this.meshes.forEach((mesh, i) => {
      const x = xs[i];
      mesh.visible = Math.abs(x) < this.w;
      mesh.position.x = x;
      const u = this.materials[i].uniforms;
      u.uProgress.value = x / this.w;
      u.uShift.value = fx.shift;
      u.uMouse.value.set(fx.mouseX, fx.mouseY);
      u.uHover.value = fx.hover;
      u.uLook.value.set(fx.lookX, fx.lookY);
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const t of this.textures) t.dispose();
    for (const m of this.materials) m.dispose();
    this.meshes[0]?.geometry.dispose();
    // The canvas keeps its GL context, and with it the flip-on-upload setting the images
    // left on. Reset it, or a renderer made on the same canvas later (a remount) starts
    // with WebGL warnings.
    const ctx = this.renderer.getContext();
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
    this.renderer.dispose();
  }
}
