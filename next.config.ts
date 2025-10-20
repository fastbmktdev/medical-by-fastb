import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function getContentSecurityPolicy(isDev: boolean): string {
  const connectSrc =
    "connect-src 'self' *.supabase.co" +
    (isDev ? " http://127.0.0.1:54321 http://localhost:*" : "") +
    ";";
  return [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data: blob: https:;",
    "font-src 'self';",
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
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
