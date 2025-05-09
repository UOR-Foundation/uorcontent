# Direct Vercel CLI Deployment Guide

Since GitHub integration deployment is encountering issues, this guide provides step-by-step instructions for deploying the UOR Content Frontend directly using the Vercel CLI.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account
- Git repository access

## Setup

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/UOR-Foundation/uorcontent.git
   cd uorcontent
   ```

3. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

## Configuration

1. Create a minimal `.vercelignore` file to exclude unnecessary files:
   ```bash
   echo "node_modules\n.next\n.git" > .vercelignore
   ```

2. Ensure your `next.config.mjs` has the following settings:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     output: 'standalone',
     experimental: {
       forceSwcTransforms: true,
     },
     eslint: {
       ignoreDuringBuilds: true,
     },
     typescript: {
       ignoreBuildErrors: true,
     },
   };

   export default nextConfig;
   ```

## Deployment

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the interactive prompts:
   - Select your Vercel scope/account
   - Confirm the project name (or provide a custom name)
   - Confirm the directory to deploy is the current directory
   - Override the build settings if prompted:
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Development Command: `npm run dev`

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Environment Variables

Set the required environment variables:

```bash
vercel env add NEXT_PUBLIC_MCP_API_URL
```

When prompted, enter `/api/mcp` as the value.

## Troubleshooting

If you encounter deployment issues:

1. **Build Errors**:
   - Run `vercel build` locally to debug build issues
   - Check the build logs with `vercel logs`

2. **Runtime Errors**:
   - Check the function logs with `vercel logs`
   - Use `vercel dev` to test locally

3. **Deployment Timeout**:
   - Try deploying with `--timeout 2m` to extend the build timeout

4. **API Connection Issues**:
   - Verify that the `NEXT_PUBLIC_MCP_API_URL` environment variable is correctly set
   - Check that the MCP server is accessible from the deployed frontend

## Monitoring

Monitor your deployment:

```bash
vercel logs
```

## Redeployment

To redeploy after making changes:

1. Make your changes to the codebase
2. Commit the changes
3. Run `vercel` again to deploy

## Team Collaboration

To add team members to the project:

```bash
vercel teams invite user@example.com
```

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
