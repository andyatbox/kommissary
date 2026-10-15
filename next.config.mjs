/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off deliberately. Strict Mode double-invokes renders and mounts effects twice in
  // DEV ONLY (it's inert in production), which remounts Sanity Studio's Portable Text
  // editor mid-edit — that's what was closing the link/anchor dialog on every keystroke.
  // The 3D scenes (R3F) are happier without the double-mount too.
  reactStrictMode: false,

  // A self-contained server bundle (.next/standalone/server.js), but only when asked for:
  // scripts/deploy-preview.sh builds with NEXT_OUTPUT=standalone, the same bundle
  // Hostinger's own Node.js builds produce. Left off otherwise so `npm start` still works.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
  // The deploy builds into its own folder, so it never disturbs a running `npm run dev`
  // (which owns .next).
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),

  // Served as-is, not resized per request. Only the Nutrition Box, Educators and
  // Community Leaders pages use next/image, for small pre-sized PNGs; on-the-fly
  // optimization would spend shared hosting's CPU on every image request.
  images: { unoptimized: true },

  // 1.0 addresses that still get visits. /medicaid and /screening are the retired
  // Nutrition Box pages, which 1.0 already sends to /bronx; kept so old links and printed
  // flyers keep working once 2.0 serves kommissary.com. See HOSTING.md for the rest of the
  // 1.0 addresses, which need a decision before launch.
  async redirects() {
    return [
      { source: '/medicaid', destination: '/bronx', permanent: true },
      { source: '/screening', destination: '/bronx', permanent: true },
      // The 2.0 page /bronx replaced (its Sanity Page is being deleted).
      { source: '/medicaid-nutrition-box', destination: '/bronx', permanent: true },
    ];
  },
};

export default nextConfig;
