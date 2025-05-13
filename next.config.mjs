/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.imgur.com', 'cdn.warpcast.com', 'res.cloudinary.com'],
    unoptimized: true,
  },

  // Completely disable all checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript completely
    ignoreBuildErrors: true,
    tsconfigPath: "jsconfig.json", 
  },
  // Set experimental options for maximum compatibility
  experimental: {
    forceSwcTransforms: true,
    typedRoutes: false,
    esmExternals: false
  },
  swcMinify: true,
  distDir: '.next',
  
  // Simplify the webpack config to bypass TypeScript
  webpack: (config) => {
    // Treat all .ts/.tsx files as .js/.jsx
    const index = config.module.rules.findIndex(
      (rule) => rule.test && rule.test.toString().includes('tsx|ts')
    );
    
    if (index !== -1) {
      config.module.rules[index] = {
        ...config.module.rules[index],
        test: /\.(js|jsx)$/,
      };
    }
    
    // Skip all TypeScript resolution
    config.resolve.extensions = ['.js', '.jsx', '.json'];

    return config;
  },
};

export default nextConfig;
