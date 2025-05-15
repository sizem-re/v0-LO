/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['i.imgur.com', 'cdn.warpcast.com', 'res.cloudinary.com'],
    unoptimized: true,
  },
  // Specify the Node.js version for Vercel
  experimental: {
    serverComponentsExternalPackages: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
