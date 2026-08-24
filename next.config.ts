import type { NextConfig } from 'next';

/// The console is an internal tool. Two things follow from that, and both are
/// enforced here rather than left to a deployment checklist:
///
///  * `X-Robots-Tag: noindex` — a crawler reaching a page that lists doctors'
///    registration numbers is a data-exposure incident, not a marketing win.
///  * no `poweredByHeader` — nothing to gain from naming the framework.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
};

export default nextConfig;
