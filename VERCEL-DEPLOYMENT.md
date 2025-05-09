# Vercel Deployment Guide for UOR Content Frontend

This guide provides step-by-step instructions for deploying the UOR Content Frontend to Vercel.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account
- Git repository access

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/UOR-Foundation/uorcontent.git
   cd uorcontent
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Run the development server to test locally:
   ```bash
   npm run dev
   ```

4. Build the application to test the production build:
   ```bash
   npm run build
   ```

## Vercel Deployment

### Option 1: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   cd frontend
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New" > "Project"

4. Import your GitHub repository

5. Configure the project:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Environment Variables:
     - `NEXT_PUBLIC_MCP_API_URL`: `/api/mcp`

6. Click "Deploy"

## Configuration Files

The repository includes the following configuration files for Vercel deployment:

### vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_MCP_API_URL": "/api/mcp"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    forceSwcTransforms: true,
  },
  env: {
    NEXT_PUBLIC_MCP_API_URL: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
  },
  async rewrites() {
    return [
      {
        source: '/api/mcp',
        destination: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
      },
    ];
  },
};

export default nextConfig;
```

## Continuous Deployment

Vercel automatically deploys your application when you push changes to your repository. Each pull request gets its own preview deployment.

## Troubleshooting

### Build Errors

- **SWC Compilation Issues**: If you encounter SWC compilation issues with custom Babel config, use the `forceSwcTransforms: true` option in next.config.mjs.
- **Font Loading Errors**: Make sure to use the `'use client'` directive for components that use client-side hooks.
- **API Connection Issues**: Verify that the `NEXT_PUBLIC_MCP_API_URL` environment variable is correctly set.

### Runtime Errors

- **Client/Server Component Errors**: Ensure that components using browser APIs are marked with `'use client'` directive.
- **API Connection Issues**: Check that the MCP server is running and accessible from the deployed frontend.

## Monitoring and Analytics

Vercel provides built-in analytics and monitoring tools:

1. Go to your project in the Vercel dashboard
2. Navigate to "Analytics" to view performance metrics
3. Check "Logs" for runtime errors and issues

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
