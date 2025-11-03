import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function getContentSecurityPolicy(isDev: boolean): string {
  const connectSrc =
    "connect-src 'self' *.supabase.co *.stripe.com https://vercel.live" +
    (isDev ? " http://127.0.0.1:54321 http://localhost:*" : "") +
    ";";

  return [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com https://vercel.live;",
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data: blob: https:;",
    "font-src 'self';",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;",
    connectSrc,
    "frame-ancestors 'self';",
  ]
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: getContentSecurityPolicy(isDevelopment),
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Build configuration
  // In production, errors should NOT be ignored to ensure code quality
  // In development, we allow ignoring errors for faster iteration (optional)
  eslint: {
    // Only ignore in development if explicitly set via env var
    // Set IGNORE_ESLINT_BUILD_ERRORS=true to ignore ESLint errors during builds
    ignoreDuringBuilds: process.env.IGNORE_ESLINT_BUILD_ERRORS === 'true' && process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Only ignore in development if explicitly set via env var
    // Set IGNORE_TYPESCRIPT_BUILD_ERRORS=true to ignore TypeScript errors during builds
    // ⚠️ RECOMMENDED: Fix errors instead of ignoring them
    // Note: Analysis tools in src/analysis/ are dev utilities, not part of production build
    // Exclude them from type checking during build
    ignoreBuildErrors: false,
  },
  // Exclude analysis tools from build completely
  experimental: {
    serverComponentsExternalPackages: ['chokidar'],
  },
  // Exclude analysis tools from build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'chokidar': false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
