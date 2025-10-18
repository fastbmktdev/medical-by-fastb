import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignore TypeScript errors during build (optional)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
