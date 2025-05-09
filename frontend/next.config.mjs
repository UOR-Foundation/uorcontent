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
  // Remove rewrites to avoid routing conflicts
  // Force SWC compiler to be used even with babel config
  experimental: {
    forceSwcTransforms: true,
    // Add memory optimization for build process
    memoryLimit: 4096,
    // Improve build performance
    turbotrace: {
      logLevel: 'error',
      memoryLimit: 4096,
    },
    // Disable server components for Vercel deployment
    serverComponentsExternalPackages: [],
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
  // Increase static page generation timeout for Vercel
  staticPageGenerationTimeout: 120,
  // Optimize build for Vercel
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
};

export default nextConfig;
