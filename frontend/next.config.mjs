/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Vercel deployment
  images: {
    domains: [], // Add any image domains here if needed
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_MCP_API_URL: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
  },
  // Add rewrites for API endpoints if needed
  async rewrites() {
    return [
      {
        source: '/api/mcp',
        destination: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
      },
    ];
  },
  // Force SWC compiler to be used even with babel config
  experimental: {
    forceSwcTransforms: true,
  },
  // Enable ESLint during build to enforce lint-checking
  eslint: {
    // Run ESLint during build to fail if linting issues are detected
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  // Enable TypeScript checking during build to enforce type safety
  typescript: {
    // Run TypeScript checking during build to fail if type errors are detected
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
