# Actions Role: Phase 4 CI/CD Pipeline Setup

This document outlines the CI/CD pipeline setup for Phase 4 of the UOR Content Management Client, ensuring proper build, test, and deployment processes.

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

```yaml
name: Phase 4 CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/**'
      - 'tests/**'
      - '.github/workflows/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/**'
      - 'tests/**'
      - '.github/workflows/**'

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
      # Ensure build fails if any linting issues are detected
      continue-on-error: false
      
    - name: Type check
      run: npm run type-check
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm run test
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        directory: ./coverage
        fail_ci_if_error: true

  integration-test:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Integration tests
      run: npm run test:integration
      
  deploy-docs:
    runs-on: ubuntu-latest
    needs: [build, integration-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build docs
      run: npm run docs
    
    - name: Deploy docs
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs
```

## Build Process

### NPM Scripts Configuration

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "type-check": "tsc --noEmit",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.js",
    "docs": "typedoc --out docs src",
    "cli": "ts-node src/cli/index.ts"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### ESLint Configuration

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-unused-expressions": "error",
    "no-var": "error",
    "prefer-const": "error"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli/index.ts',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// jest.integration.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testTimeout: 30000
};
```

## Deployment Process

### Package Configuration

```json
{
  "name": "uor-content-management-client",
  "version": "1.0.0",
  "description": "UOR Content Management Client",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "uor": "dist/cli/index.js"
  },
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  uor-content-management:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./content:/app/content
    environment:
      - NODE_ENV=production
      - PORT=3000
```

## Release Process

### Release Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
      # Ensure build fails if any linting issues are detected
      continue-on-error: false
      
    - name: Type check
      run: npm run type-check
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm run test
    
    - name: Create GitHub Release
      id: create_release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false
    
    - name: Build package
      run: npm pack
    
    - name: Upload package to release
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./uor-content-management-client-*.tgz
        asset_name: uor-content-management-client.tgz
        asset_content_type: application/gzip
    
    - name: Build Docker image
      run: docker build -t uor-foundation/uor-content-management-client:${{ github.ref_name }} .
    
    - name: Login to GitHub Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Push Docker image
      run: |
        docker tag uor-foundation/uor-content-management-client:${{ github.ref_name }} ghcr.io/uor-foundation/uor-content-management-client:${{ github.ref_name }}
        docker tag uor-foundation/uor-content-management-client:${{ github.ref_name }} ghcr.io/uor-foundation/uor-content-management-client:latest
        docker push ghcr.io/uor-foundation/uor-content-management-client:${{ github.ref_name }}
        docker push ghcr.io/uor-foundation/uor-content-management-client:latest
```

## Integration with Previous Phases

The CI/CD pipeline integrates with previous phases by:

1. **Phase 1 Integration**:
   - Enforces TypeScript strict mode configuration
   - Validates type definitions for content models
   - Ensures file system utilities work correctly
   - Verifies schema validation for content integrity

2. **Phase 2 Integration**:
   - Tests ConceptManager functionality
   - Verifies IndexManager for efficient content retrieval
   - Validates Query Operations for content listing

3. **Phase 3 Integration**:
   - Tests ResourceManager, TopicManager, and PredicateManager
   - Verifies RelationshipManager for relationship operations
   - Ensures reference integrity across all content types

4. **Phase 4 Integration**:
   - Tests ContentRepository API for unified content management
   - Verifies Advanced Query and Search for powerful search capabilities
   - Validates Content Validation and Integrity for content validation
   - Tests Content Import/Export for data exchange
   - Verifies CLI Interface for command-line access

## Monitoring and Alerting

### Health Check Endpoint

```typescript
import { MCPServer } from '../server/mcp-server';
import { ContentRepository } from '../repository/content-repository';

/**
 * Registers health check endpoints with the MCP server
 * @param mcpServer MCP server instance
 * @param contentRepository Content Repository instance
 */
export function registerHealthCheckEndpoints(
  mcpServer: MCPServer,
  contentRepository: ContentRepository
): void {
  // Health check
  mcpServer.registerMethod('health.check', async () => {
    const health = await contentRepository.checkHealth();
    return {
      status: health.status,
      timestamp: health.timestamp,
      version: process.env.npm_package_version || 'unknown'
    };
  });

  // Detailed health check
  mcpServer.registerMethod('health.detailed', async () => {
    return contentRepository.checkHealth();
  });
}
```

### Prometheus Metrics

```typescript
import { MCPServer } from '../server/mcp-server';
import * as prometheus from 'prom-client';

/**
 * Registers Prometheus metrics endpoints with the MCP server
 * @param mcpServer MCP server instance
 */
export function registerMetricsEndpoints(
  mcpServer: MCPServer
): void {
  // Initialize metrics
  const registry = new prometheus.Registry();
  
  // Add default metrics
  prometheus.collectDefaultMetrics({ register: registry });
  
  // Custom metrics
  const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });
  
  const contentOperations = new prometheus.Counter({
    name: 'content_operations_total',
    help: 'Total number of content operations',
    labelNames: ['type', 'operation']
  });
  
  registry.registerMetric(httpRequestDuration);
  registry.registerMetric(contentOperations);
  
  // Metrics endpoint
  mcpServer.registerMethod('metrics', async () => {
    return registry.metrics();
  });
}
```

## Security Measures

### Security Headers

```typescript
import { MCPServer } from '../server/mcp-server';

/**
 * Adds security headers to the MCP server
 * @param mcpServer MCP server instance
 */
export function addSecurityHeaders(
  mcpServer: MCPServer
): void {
  mcpServer.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
}
```

### Input Validation Middleware

```typescript
import { MCPServer } from '../server/mcp-server';
import Ajv from 'ajv';

/**
 * Adds input validation middleware to the MCP server
 * @param mcpServer MCP server instance
 */
export function addInputValidation(
  mcpServer: MCPServer
): void {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    validateFormats: true
  });
  
  mcpServer.use((req, res, next) => {
    // Get method schema
    const methodName = req.body.method;
    const schema = mcpServer.getMethodSchema(methodName);
    
    if (schema) {
      // Validate params against schema
      const validate = ajv.compile(schema);
      const valid = validate(req.body.params);
      
      if (!valid) {
        return res.status(400).json({
          error: {
            code: -32602,
            message: 'Invalid params',
            data: validate.errors
          }
        });
      }
    }
    
    next();
  });
}
```

## Conclusion

The CI/CD pipeline for Phase 4 of the UOR Content Management Client ensures proper build, test, and deployment processes. It integrates with previous phases and provides comprehensive monitoring, alerting, and security measures.

The pipeline follows Stone's role-based development approach and has been validated using Stone's multi-agent capabilities. It ensures that all Phase 4 components are properly built, tested, and deployed.
