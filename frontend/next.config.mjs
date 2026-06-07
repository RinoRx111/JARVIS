/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
