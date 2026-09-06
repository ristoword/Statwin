import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiInternal =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    const destination = apiInternal.replace(/\/$/, '');
    return [
      { source: '/api/:path*', destination: `${destination}/api/:path*` },
      { source: '/docs', destination: `${destination}/docs` },
      { source: '/docs/:path*', destination: `${destination}/docs/:path*` },
    ];
  },
};

export default nextConfig;
