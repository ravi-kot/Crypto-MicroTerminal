/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // Optimize for Vercel
  output: 'standalone',
  // Enable static optimization where possible
  swcMinify: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

