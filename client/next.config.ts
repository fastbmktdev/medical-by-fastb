import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isDevelopment = process.env.NODE_ENV === "development";

function getContentSecurityPolicy(isDev: boolean): string {
  const connectSrc =
    "connect-src 'self' *.supabase.co *.stripe.com https://vercel.live https://www.google-analytics.com https://www.googletagmanager.com" +
    (isDev ? " http://127.0.0.1:8000 http://127.0.0.1:54321 http://localhost:*" : "") +
    ";";

  return [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com https://vercel.live https://www.googletagmanager.com;",
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data: blob: https:;",
    "font-src 'self';",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live;",
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
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
        'supports-color': false,
        'debug': false,
        'http-proxy-agent': false,
        'https-proxy-agent': false,
        '@sentry/node': false,
        '@sentry/node-core': false,
      };
      
      // Mark server-only packages as externals
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }: { request: string }) => {
            if (request === 'supports-color' || 
                request === 'debug' || 
                request === '@sentry/node' ||
                request === '@sentry/node-core') {
              return 'commonjs ' + request;
            }
          }
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push({
          'supports-color': 'commonjs supports-color',
          'debug': 'commonjs debug',
          '@sentry/node': 'commonjs @sentry/node',
          '@sentry/node-core': 'commonjs @sentry/node-core',
        });
      }
      
      // Replace server-only modules with empty modules in client bundle
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^jsdom$/,
          path.resolve(__dirname, './src/lib/empty-module.js')
        )
      );
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^isomorphic-dompurify$/,
          path.resolve(__dirname, './src/lib/empty-module.js')
        )
      );
      
      // Replace supports-color and related Node.js modules with empty modules
      // This prevents bundling issues when server-only code is imported
      const emptyModulePath = path.resolve(__dirname, './src/lib/empty-module.js');
      const nodeModulesToReplace = [
        'supports-color',
        'debug',
        'http-proxy-agent',
        'https-proxy-agent',
        '@sentry/node',
        '@sentry/node-core',
      ];
      
      nodeModulesToReplace.forEach(moduleName => {
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            new RegExp(`^${moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
            emptyModulePath
          )
        );
      });
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

export default configWithIntl;
