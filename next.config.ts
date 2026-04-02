import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // www → apex
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.trip-ai.xyz' }],
        destination: 'https://trip-ai.xyz/:path*',
        permanent: true,
      },
      // Vercel preview URL → apex (本番のみ)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'auto-trip-ai.vercel.app' }],
        destination: 'https://trip-ai.xyz/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
