# Next.js App Router Installation Specification

## Overview

This specification outlines the implementation plan for integrating a Next.js application with App Router into the UOR Content Management Client repository. The integration will provide a modern frontend interface for interacting with the UOR content management capabilities.

## Requirements

1. Install a Next.js application with App Router
2. Ensure proper integration with the existing TypeScript codebase
3. Maintain compatibility with the current MCP server implementation
4. Follow repository code standards and linting requirements
5. Determine optimal installation location (workspace vs. temporary directory)

## Installation Location Analysis

### Option 1: Direct Workspace Integration

**Pros:**
- Direct access to existing TypeScript types and utilities
- Simplified import paths between backend and frontend
- Single repository for both backend and frontend code

**Cons:**
- Potential for conflicts with existing code structure
- May require significant configuration changes to support both Next.js and existing TypeScript setup
- Risk of breaking existing functionality

### Option 2: Separate Directory in Workspace

**Pros:**
- Clear separation between frontend and backend code
- Reduced risk of conflicts with existing code
- Easier to maintain separate build processes

**Cons:**
- More complex import paths between frontend and backend
- Requires additional configuration for TypeScript path aliases
- Potential duplication of types and utilities

### Option 3: Temporary Directory (Development Only)

**Pros:**
- Complete isolation from existing codebase
- No risk to existing functionality
- Simplified development and testing

**Cons:**
- Disconnected from backend services
- Requires additional setup for API communication
- Not a long-term solution for integration

## Recommendation

Based on the analysis, the recommended approach is **Option 2: Separate Directory in Workspace**. This provides a balance between integration and isolation, allowing the Next.js application to leverage existing code while maintaining a clear separation of concerns.

The Next.js application should be installed in a new directory named `frontend` at the repository root.

## Implementation Steps

1. Create a new `frontend` directory at the repository root
2. Install Next.js with App Router in the `frontend` directory
3. Configure TypeScript path aliases to access shared types and utilities
4. Set up API client for communication with the MCP server
5. Implement basic frontend components for content management
6. Configure build and development scripts
7. Update documentation to include frontend setup instructions

## Technical Details

### Next.js Installation Command

```bash
npx create-next-app@latest frontend --app --typescript --eslint --tailwind --src-dir --import-alias "@/*"
```

### TypeScript Configuration

The frontend's `tsconfig.json` should include path aliases to access shared code:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../src/models/*", "../src/types.ts"]
    }
  }
}
```

### API Client Setup

Create an API client in the frontend to communicate with the MCP server:

```typescript
// src/api/client.ts
import { MCPRequest, MCPResponse } from '@shared/types';

export async function mcpClient<T>(request: MCPRequest): Promise<MCPResponse<T>> {
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  return response.json();
}
```

### Development Scripts

Add scripts to package.json for frontend development:

```json
{
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "build:frontend": "cd frontend && npm run build",
    "start:frontend": "cd frontend && npm run start"
  }
}
```

## Testing Strategy

1. Unit tests for frontend components using Jest and React Testing Library
2. Integration tests for API client and MCP server communication
3. End-to-end tests for complete user workflows

## Deployment Considerations

1. Configure Next.js for static export if needed
2. Set up proper environment variables for production deployment
3. Ensure proper CORS configuration for API communication

## Conclusion

This implementation plan provides a structured approach to integrating a Next.js application with App Router into the UOR Content Management Client repository. By installing the application in a separate `frontend` directory, we maintain a clear separation of concerns while enabling integration with the existing codebase.
