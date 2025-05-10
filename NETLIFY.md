# Netlify Integration for UOR Content Repository

This document provides information about the Netlify integration for the UOR Content Repository.

## Overview

The UOR Content Repository is deployed to Netlify to provide a public-facing interface for browsing and interacting with UOR content. The deployment includes the Next.js frontend application located in the `/frontend` directory.

## Deployment Strategy

The UOR Content Repository uses server-side rendering (SSR) instead of static site generation (SSG) for Netlify deployment. This approach was chosen to avoid timeout issues during the build process with large static exports.

## Configuration

The Netlify deployment is configured using the `netlify.toml` file at the root of the repository. This file specifies:

- Build settings (command, publish directory)
- Environment variables
- Redirects for client-side routing
- Headers for security and caching

## Deployment Process

The repository is set up for continuous deployment to Netlify:

1. When changes are pushed to the `main` branch, a GitHub Actions workflow is triggered
2. The workflow builds the Next.js frontend application in standalone mode
3. The built application is deployed to Netlify as a Node.js server

You can also manually trigger a deployment from the GitHub Actions tab.

## Environment Variables

The following environment variables are used in the Netlify deployment:

- `NEXT_PUBLIC_MCP_API_URL`: URL for the MCP API (default: "/api/mcp")
- `NODE_VERSION`: Node.js version to use (default: "18")

Additional environment variables can be configured in the Netlify dashboard.

## Local Development

To test the Netlify configuration locally, you can use the Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to the repository root
cd /path/to/uorcontent

# Start the Netlify dev server
netlify dev
```

## Troubleshooting

If you encounter issues with the Netlify deployment:

1. Check the Netlify build logs for errors
2. Verify that the `netlify.toml` configuration is correct
3. Ensure that the Next.js build is successful locally
4. Check that all required environment variables are set

## Performance Optimization

The server-side rendering approach provides several benefits:

1. Eliminates build timeout issues that occurred with static site generation
2. Enables dynamic content generation for complex pages
3. Improves build performance by avoiding the generation of all static pages upfront
