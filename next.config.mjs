/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off deliberately. Strict Mode double-invokes renders and mounts effects twice in
  // DEV ONLY (it's inert in production), which remounts Sanity Studio's Portable Text
  // editor mid-edit — that's what was closing the link/anchor dialog on every keystroke.
  // The 3D scenes (R3F) are happier without the double-mount too.
  reactStrictMode: false,
};

export default nextConfig;
