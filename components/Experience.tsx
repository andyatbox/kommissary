'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Scene from './Scene';
import CameraRig from './CameraRig';
import Buttons from './Buttons';
import { getQuality } from '@/lib/perf';

/**
 * The words are static and the models only hover, so a shadow map rebuilt every
 * frame is pure waste. Throttling it is the single biggest saving on weak GPUs.
 */
function ShadowThrottle({ interval }: { interval: number }) {
  const gl = useThree((s) => s.gl);
  const frame = useRef(0);

  useEffect(() => {
    gl.shadowMap.autoUpdate = interval <= 1;
    gl.shadowMap.needsUpdate = true;
  }, [gl, interval]);

  useFrame(() => {
    if (interval <= 1) return;
    frame.current += 1;
    if (frame.current % interval === 0) gl.shadowMap.needsUpdate = true;
  });

  return null;
}

/** Trims resolution when frames get expensive, and restores it when they don't. */
function AdaptiveResolution({
  min,
  max,
  onFallback,
}: {
  min: number;
  max: number;
  onFallback: () => void;
}) {
  const setDpr = useThree((s) => s.setDpr);
  return (
    <PerformanceMonitor
      onChange={({ factor }) => setDpr(min + (max - min) * factor)}
      flipflops={3}
      onFallback={() => {
        setDpr(min);
        onFallback();
      }}
    />
  );
}

export default function Experience() {
  // Detected once on the client; the server render can't know the GPU.
  const [quality, setQuality] = useState(() => getQuality());
  useEffect(() => setQuality(getQuality()), []);

  // If DPR alone can't rescue the frame rate, back the shadows off further. Only
  // settings that are cheap to change live are touched here — rebuilding text
  // geometry or recompiling shaders mid-session would hitch worse than it helps.
  // Kept mild: the shadow frustum tracks the camera, so a heavily throttled map
  // lags behind what it's lighting and looks worse than it saves.
  const [struggling, setStruggling] = useState(false);
  const shadowInterval = struggling
    ? Math.max(quality.shadowInterval, 2)
    : quality.shadowInterval;

  return (
    <div id="canvas-root" className="fixed inset-0">
      <Canvas
        shadows={quality.shadows}
        dpr={quality.dpr}
        gl={{ antialias: quality.antialias, powerPreference: 'high-performance', alpha: true }}
        // near is well clear of anything we get close to; keeping it off 0.1 preserves
        // depth precision now that far reaches 900 for the overview shot.
        camera={{ position: [0, 2.5, 26], fov: 40, near: 0.5, far: 900 }}
      >
        <Suspense fallback={null}>
          <Scene quality={quality} />
        </Suspense>
        <CameraRig />
        {/* After CameraRig, so the CSS button layer draws against the camera's
            current-frame pose. */}
        <Buttons />
        <ShadowThrottle interval={shadowInterval} />
        <AdaptiveResolution
          min={quality.dpr[0]}
          max={quality.dpr[1]}
          onFallback={() => setStruggling(true)}
        />
      </Canvas>
    </div>
  );
}
