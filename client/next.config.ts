import type { NextConfig } from "next";
// Temporarily disabled due to compatibility issues with Next.js 15.1.6
// import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isDevelopment = process.env.NODE_ENV === "development";

function getContentSecurityPolicy(isDev: boolean): string {
  const connectSrc =
    "connect-src 'self' *.supabase.co *.stripe.com https://vercel.live *.sentry.io *.ingest.sentry.io https://www.google-analytics.com https://www.googletagmanager.com" +
    (isDev ? " http://127.0.0.1:8000 http://127.0.0.1:54321 http://localhost:*" : "") +
    ";";

  return [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com https://vercel.live https://www.googletagmanager.com;",
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
  // HSTS (HTTP Strict Transport Security) - only in production
  ...(isDevelopment ? [] : [{
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  }]),
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.IGNORE_ESLINT_BUILD_ERRORS === 'true' && process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  outputFileTracingRoot: __dirname,
  // API rewrites to proxy requests to Express server
  async rewrites() {
    const apiServerUrl = process.env.API_SERVER_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiServerUrl}/api/:path*`,
      },
    ];
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      '@heroui/react',
      'date-fns',
      'framer-motion',
    ],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: isDevelopment ? false : {
      exclude: ['error', 'warn'],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { isServer, webpack }) => {
    // Add alias for shared package to resolve @/* imports
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        jsdom: false,
        canvas: false,
        net: false,
        tls: false,
        fs: false,
        'child_process': false,
        'isomorphic-dompurify': false,
      };
    }

    // Fix for Next.js 15.5.x WebpackError constructor bug
    // Use Terser plugin instead of Next.js built-in minifier to avoid the error
    if (!isDevelopment) {
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false, // Keep console.error and console.warn
            },
            format: {
              comments: false, // Remove comments
            },
          },
          extractComments: false, // Don't extract comments to separate files
        }),
      ];
    }

    config.ignoreWarnings = [
    //   {
    //     module: /node_modules\/@prisma\/instrumentation/,
    //   },
    //   {
    //     module: /node_modules\/@opentelemetry\/instrumentation/,
    //   },
    //   {
    //     module: /node_modules\/require-in-the-middle/,
    //   },
    //   {
    //     module: /node_modules\/@supabase\/realtime-js/,
    //   },
    //   {
    //     message: /Critical dependency: the request of a dependency is an expression/,
    //   },
    //   {
    //     message: /Critical dependency: require function is used in a way/,
    //   },
    //   {
    //     message: /A Node\.js API is used \(process\.version/,
    //   },
      {
        module: /node_modules\/@supabase\/supabase-js/,
      },
    ];
    return config;
  },
};

// Apply next-intl plugin first
const configWithIntl = withNextIntl(nextConfig);

// Then wrap with Sentry configuration if DSN is provided
// Temporarily disable Sentry during build due to compatibility issues with Next.js 15.1.6
// const configWithSentry = false && (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)
//   ? withSentryConfig(configWithIntl, {
//       org: process.env.SENTRY_ORG,
//       project: process.env.SENTRY_PROJECT,
//       silent: !isDevelopment,
//       widenClientFileUpload: true,
//       tunnelRoute: "/monitoring",
//       disableLogger: true,
//       automaticVercelMonitors: true,
//     })
//   : configWithIntl;

export default configWithIntl;

