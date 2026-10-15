/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off deliberately. Strict Mode double-invokes renders and mounts effects twice in
  // DEV ONLY (it's inert in production), which remounts Sanity Studio's Portable Text
  // editor mid-edit — that's what was closing the link/anchor dialog on every keystroke.
  // The 3D scenes (R3F) are happier without the double-mount too.
  reactStrictMode: false,

  // Self-contained server bundle (.next/standalone/server.js) for hosting on Hostinger's
  // Node.js apps: it carries only the node_modules the app actually uses, so the server
  // needs no `npm install`. See scripts/deploy-staging.sh. Vercel ignores this setting.
  output: 'standalone',

  // Served as-is, not resized per request. Only the Nutrition Box, Educators and
  // Community Leaders pages use next/image, for small pre-sized PNGs; on-the-fly
  // optimization would need the native `sharp` package built for the server's platform
  // and would spend shared hosting's CPU on every image request.
  images: { unoptimized: true },
};

export default nextConfig;
