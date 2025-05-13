/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['i.imgur.com', 'cdn.warpcast.com', 'res.cloudinary.com'],
    unoptimized: true,
  },

  // Disable checks
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Set essential experimental options
  experimental: {
    forceSwcTransforms: true,
  },
  
  swcMinify: true,
};

export default nextConfig;
