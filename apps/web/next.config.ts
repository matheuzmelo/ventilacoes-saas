import { config } from 'dotenv';
import type { NextConfig } from 'next';

config({ path: ['../../.env', '../../.env.local', '.env.local', '.env'] });

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  transpilePackages: ['@vs/ui'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
