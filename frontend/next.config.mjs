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
};

export default nextConfig;
