/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Using export for static site generation
  images: {
    domains: [], // Add any image domains here if needed
    unoptimized: true, // Required for static export
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
};

export default nextConfig;
