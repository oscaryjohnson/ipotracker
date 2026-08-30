import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Fully static export. There is no server-side work to do -- the dataset is
   * baked in at build time and every interaction is client-side -- so this
   * deploys to Vercel, Netlify or GitHub Pages identically, with no runtime to
   * fail at request time.
   */
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
