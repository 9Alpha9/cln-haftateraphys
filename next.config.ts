import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
