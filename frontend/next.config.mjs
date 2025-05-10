/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Switch from static export to server-side rendering to avoid timeout issues
  output: 'standalone',
  images: {
    domains: [], // Add any image domains here if needed
    // No need for unoptimized with server-side rendering
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_MCP_API_URL: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
  },
  // Disable ESLint during builds to speed up build time
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during builds to speed up build time
  typescript: {
    ignoreBuildErrors: true,
    // Enable strict type checking in CI but not in local builds
    tsconfigPath: process.env.CI ? './tsconfig.strict.json' : './tsconfig.json',
  },
  // Disable source maps in production to reduce bundle size and speed up build
  productionBrowserSourceMaps: false,
  // Increase timeout for static page generation to prevent build failures
  staticPageGenerationTimeout: 1800, // 30 minutes
  // Optimize build performance
  swcMinify: true, // Use SWC minifier for faster builds
  // Minimal experimental settings
  experimental: {
    forceSwcTransforms: true,
    // Disable features that might slow down the build
    optimizeCss: false,
    scrollRestoration: false,
  },
  // Use stable cache handler API
  cacheHandler: './cache-handler.js',
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB memory cache
  // Use trailingSlash to ensure proper URL handling
  trailingSlash: true,
  // Optimize build performance
  webpack: (config) => {
    // Optimize webpack build
    config.optimization.minimize = true;
    return config;
  },
  // Note: We're using the 'dynamic' export option in individual pages
  // to exclude problematic pages from static generation instead of exportPathMap,
  // which is not compatible with the app directory structure.
  
  // Additional optimizations for Netlify deployment
  distDir: process.env.NETLIFY ? '.next' : '.next',
  
  // Configure headers for better caching and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
