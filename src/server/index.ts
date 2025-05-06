/**
 * MCP Server Entrypoint
 * 
 * This file serves as the main entry point for the MCP server,
 * which provides a standardized API for managing UOR Framework content.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { validateRequest } from './middleware/validate-request';
import { contentRoutes } from './routes/content-routes';
import { conceptRoutes } from './routes/concept-routes';
import { predicateRoutes } from './routes/predicate-routes';
import { resourceRoutes } from './routes/resource-routes';
import { topicRoutes } from './routes/topic-routes';
import { searchRoutes } from './routes/search-routes';
import { queryRoutes } from './routes/query-routes';
import { indexRoutes } from './routes/index-routes';

/**
 * MCP Server class
 * 
 * Provides a standardized API for managing UOR Framework content
 * with strict schema validation through MCP and Schema.org integration.
 */
export class MCPServer {
  private app: express.Application;
  private port: number;

  /**
   * Create a new MCP server instance
   * 
   * @param port - The port to listen on (default: 3000)
   */
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configureRoutes();
  }

  /**
   * Configure middleware for the server
   */
  private configureMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    }));
    
    this.app.use(express.json());
    
    this.app.use(requestLogger);
    this.app.use(validateRequest);
  }

  /**
   * Configure routes for the server
   */
  private configureRoutes(): void {
    this.app.use('/api/content', contentRoutes);
    this.app.use('/api/concepts', conceptRoutes);
    this.app.use('/api/predicates', predicateRoutes);
    this.app.use('/api/resources', resourceRoutes);
    this.app.use('/api/topics', topicRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/query', queryRoutes);
    this.app.use('/api/index', indexRoutes);
    
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   * 
   * @returns A promise that resolves when the server is started
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`MCP server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Get the Express application instance
   * 
   * @returns The Express application
   */
  public getApp(): express.Application {
    return this.app;
  }
}

if (require.main === module) {
  const server = new MCPServer();
  server.start().catch(console.error);
}
