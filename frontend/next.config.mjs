/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // Static export for GitHub Pages
  output: "export",
  trailingSlash: true,
  // Derive basePath/assetPrefix from env at build time
  basePath: (() => {
    const raw = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if (!raw) return undefined;
    // remove trailing slash to satisfy Next.js requirement
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  })(),
  assetPrefix: (() => {
    const raw = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if (!raw) return undefined;
    return raw.endsWith("/") ? raw : `${raw}/`;
  })(),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;


