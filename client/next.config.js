const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dopa-runtime',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence "multiple lockfiles" warning — monorepo has both root + client lockfiles
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  serverExternalPackages: ['pdfkit', 'exceljs'],
  // Bundle Noto Sans TTF files with the PDF export route on Vercel
  outputFileTracingIncludes: {
    '/api/entries/export': ['./lib/server/fonts/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // DENY is stricter than SAMEORIGIN — no legitimate reason to iframe this app
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — tell browsers to enforce HTTPS for 2 years; Vercel already does this at edge
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP — tightened for Next.js + Tailwind (needs unsafe-inline) + Google Fonts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              // The Workbox service worker uses fetch() to cache external resources.
              // font domains must be in connect-src (not just style-src/font-src) because
              // the SW caches them via the Fetch API, which is governed by connect-src.
              "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
