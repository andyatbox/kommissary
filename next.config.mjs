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
      // The rest of 1.0's addresses, each to its nearest 2.0 page (decided at launch,
      // October 2026; see HOSTING.md).
      { source: '/about', destination: '/our-story', permanent: true },
      { source: '/services', destination: '/bespoke-meals', permanent: true },
      { source: '/jobs-fair', destination: '/careers', permanent: true },
      { source: '/spotlight', destination: '/social', permanent: true },
      // The NYC Groceries proposal: its first address (kommissary.com/nyc-groceries/, linked from
      // the proposal sent to NYCEDC) and the folder it was briefly served from both go to its
      // own site, keeping the rest of the path (e.g. its PDF).
      { source: '/nyc-groceries/:path*', destination: 'https://nyc-groceries.kommissary.com/:path*', permanent: true },
      { source: '/nyc-groceries-site/:path*', destination: 'https://nyc-groceries.kommissary.com/:path*', permanent: true },
      // 1.0's experiments and form scripts, to their nearest home (October 2026).
      { source: '/labs/hungry-no-more/:path*', destination: 'https://hungrynomore.co', permanent: true },
      { source: '/labs/:path*', destination: '/', permanent: true },
      { source: '/box/:path*', destination: '/', permanent: true },
      { source: '/src/:path*', destination: '/', permanent: true },
      { source: '/handler.php', destination: '/contact', permanent: true },
      { source: '/contact/contact-us.php', destination: '/contact', permanent: true },
      { source: '/our-impact/x-horiz-our-impact.html', destination: '/our-impact', permanent: true },
      { source: '/v2', destination: '/', permanent: true },
      { source: '/kommissary1.0', destination: '/', permanent: true },
      { source: '/home.html', destination: '/', permanent: true },
      { source: '/Xhome.html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
