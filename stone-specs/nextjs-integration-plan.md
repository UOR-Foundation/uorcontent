# Next.js Integration Plan

## Overview

This document outlines the integration plan for the Next.js application with App Router in the UOR Content Management Client repository. It follows the Stone tool's role-based development approach and provides a comprehensive plan for integrating the frontend with the existing backend services.

## PM Role: Integration Requirements

### Integration Points

1. **MCP Server Communication**
   - The frontend must communicate with the MCP server using JSON-RPC
   - API requests must include proper authentication if required
   - Error handling must be implemented for all API requests

2. **TypeScript Type Sharing**
   - The frontend must use shared TypeScript types from the backend
   - Type definitions must be kept in sync between frontend and backend
   - Type checking must be enforced in the CI/CD pipeline

3. **Content Schema Integration**
   - The frontend must understand and validate Schema.org content types
   - UI components must adapt to different content types
   - Content validation must be performed before submission

### Integration Milestones

1. **Phase 1: Basic Integration**
   - Set up Next.js application with TypeScript configuration
   - Implement API client for MCP server communication
   - Create basic UI components for content browsing

2. **Phase 2: Advanced Integration**
   - Implement content type-specific UI components
   - Add content validation and error handling
   - Integrate with authentication system if required

3. **Phase 3: Production Readiness**
   - Optimize performance and bundle size
   - Implement caching strategies
   - Set up monitoring and error tracking

## QA Role: Integration Testing Strategy

### Integration Test Cases

1. **API Client Integration**
   - Test successful communication with MCP server
   - Test error handling for various error scenarios
   - Test authentication flow if required

2. **Type Integration**
   - Test type compatibility between frontend and backend
   - Test type validation for API requests and responses
   - Test type checking in the build process

3. **Content Schema Integration**
   - Test rendering of different content types
   - Test validation of content against Schema.org standards
   - Test error handling for invalid content

### Integration Test Environment

1. **Local Integration Environment**
   - Next.js development server
   - Local MCP server instance
   - Sample content data

2. **CI Integration Environment**
   - Automated integration tests on pull requests
   - Mock MCP server for isolated testing
   - Test database with sample content

## Feature Role: Integration Implementation

### API Client Implementation

```typescript
// src/api/client.ts
import { MCPRequest, MCPResponse } from '../types/shared';

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

### MCP API Route Implementation

```typescript
// src/app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MCPRequest, MCPResponse } from '@/types/shared';

export async function POST(request: NextRequest) {
  try {
    const mcpRequest: MCPRequest = await request.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3001/api/mcp';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mcpRequest),
    });
    
    const data: MCPResponse<unknown> = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing MCP request:', error);
    
    return NextResponse.json(
      {
        id: 'error',
        error: {
          code: 500,
          message: 'Internal Server Error',
        },
        jsonrpc: '2.0',
      },
      { status: 500 }
    );
  }
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../src/models/*", "../src/types.ts"]
    }
  }
}
```

## Auditor Role: Integration Verification

### Code Quality Checklist

1. **API Client Quality**
   - Proper error handling is implemented
   - TypeScript types are correctly used
   - API requests follow JSON-RPC standard

2. **Type Integration Quality**
   - Shared types are correctly imported
   - Type checking passes with strict mode
   - No type-related errors in the codebase

3. **Content Schema Integration Quality**
   - UI components correctly handle different content types
   - Content validation is properly implemented
   - Error messages are clear and helpful

### Integration Test Quality

1. **Test Coverage**
   - All integration points are covered by tests
   - Edge cases and error scenarios are tested
   - Performance aspects are tested

2. **Test Reliability**
   - Tests are deterministic
   - Tests do not depend on external services
   - Tests clean up after themselves

## Actions Role: Integration CI/CD

### Integration Workflow

```yaml
name: Next.js Integration

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
      - 'src/models/**'
      - 'src/types.ts'
  pull_request:
    branches: [ main ]
    paths:
      - 'frontend/**'
      - 'src/models/**'
      - 'src/types.ts'

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Type check
        run: cd frontend && npm run type-check
      - name: Run integration tests
        run: cd frontend && npm run test:integration
      - name: Build
        run: cd frontend && npm run build
```

### Deployment Pipeline

1. **Integration Deployment**
   - Automatic deployment to integration environment on successful PR merge
   - Integration tests run against deployed environment
   - Manual approval required for promotion to staging

## Implementation Steps

1. **Set up Next.js Application**
   - Install Next.js with App Router in frontend directory
   - Configure TypeScript for shared types
   - Set up linting and formatting

2. **Implement API Integration**
   - Create API client for MCP server communication
   - Implement MCP API route in Next.js
   - Add error handling and logging

3. **Create Content Components**
   - Implement components for different content types
   - Add content validation
   - Create navigation and layout components

4. **Set up Testing**
   - Configure Jest and React Testing Library
   - Write unit tests for components
   - Write integration tests for API client

5. **Configure CI/CD**
   - Set up GitHub Actions workflow
   - Configure deployment pipeline
   - Add monitoring and error tracking

## Conclusion

This integration plan provides a comprehensive approach to integrating the Next.js application with App Router into the UOR Content Management Client repository. By following the Stone tool's role-based development approach, we can ensure that all aspects of integration are covered, from requirements gathering to deployment.
