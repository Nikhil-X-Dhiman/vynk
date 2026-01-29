import type { NextConfig } from 'next';
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  swSrc: "worker/index.ts",
  sw: "sw.js",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  // transpilePackages: ['@repo/db'],
};

export default withPWA(nextConfig);
