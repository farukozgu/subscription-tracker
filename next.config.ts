import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves the correct workspace root (avoid wrong-root inference
  // when there are multiple lockfiles in parent folders). This helps Vercel pick
  // the right project root during builds.
  turbopack: {
    root: './',
  },
};

export default nextConfig;
