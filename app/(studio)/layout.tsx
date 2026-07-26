import type { Metadata } from 'next';

// The Studio needs a normal scrollable page, so it gets its own root layout —
// separate from the (site) group whose globals apply `overflow: hidden` for the
// full-screen 3D canvas.
export const metadata: Metadata = {
  title: 'Kommissary Studio',
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
