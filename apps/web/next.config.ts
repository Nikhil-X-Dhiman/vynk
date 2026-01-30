// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No PWA wrapper needed here anymore!
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
};

export default nextConfig;
