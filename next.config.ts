import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  // Variants are pre-sized by scripts/resize-images.mjs and served through
  // components/ui/Img.tsx; a static export has no optimizer to run.
  images: { unoptimized: true },
  transpilePackages: ['three'],
};

export default bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(nextConfig);
