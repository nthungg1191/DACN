/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/types', '@repo/database'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;

