'use client';

import { Component, type ReactNode } from 'react';

/**
 * Wraps the 3D <Experience> so a thrown client error — most often a WebGL context that
 * couldn't be created or was lost on a weak/old device — degrades gracefully instead of
 * tripping Next.js's full-page "Application error: a client-side exception has occurred"
 * white screen. When it catches, it simply renders nothing: the fixed gradient
 * background and the HTML/CSS Overlay (both siblings, outside this boundary) stay on
 * screen, so the page still reads as the landing page rather than crashing to white.
 */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Surfaced in the console for debugging; not shown to the user.
    console.error('3D scene failed, falling back to the static background:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
