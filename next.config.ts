import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
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
    ignoreBuildErrors: false,
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
  webpack: (config) => {
    // Suppress warnings from Prisma/OpenTelemetry instrumentation
    // These are harmless warnings from third-party dependencies using dynamic requires
    config.ignoreWarnings = [
      {
        module: /node_modules\/@prisma\/instrumentation/,
      },
      {
        module: /node_modules\/@opentelemetry\/instrumentation/,
      },
      {
        module: /node_modules\/require-in-the-middle/,
      },
      {
        module: /node_modules\/@supabase\/realtime-js/,
      },
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        message: /Critical dependency: require function is used in a way/,
      },
      {
        message: /A Node\.js API is used \(process\.version/,
      },
      {
        module: /node_modules\/@supabase\/supabase-js/,
      },
    ];
    return config;
  },
  // Note: Webpack cache serialization warnings about "big strings" are harmless
  // and common in Next.js builds. They're performance suggestions from webpack's
  // cache system and don't affect functionality. Safe to ignore.
};

// Apply next-intl plugin first
const configWithIntl = withNextIntl(nextConfig);

// Then wrap with Sentry configuration if DSN is provided
const configWithSentry = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  ? withSentryConfig(configWithIntl, {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Only upload source maps in production
      silent: !isDevelopment,

      // Automatically instrument API routes
      widenClientFileUpload: true,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
      tunnelRoute: "/monitoring",

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Enables automatic instrumentation of Vercel Cron Monitors
      automaticVercelMonitors: true,
    })
  : configWithIntl;

export default configWithSentry;
