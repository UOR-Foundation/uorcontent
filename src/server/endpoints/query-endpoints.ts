/**
 * Query Endpoints
 * 
 * Implements MCP server endpoints for Query Operations.
 * Provides JSON-RPC methods for filtering, searching, and paginating content.
 */

import { Request, Response } from 'express';
import { QueryService } from '../../query/query-service';
import { UORContentItem } from '../../models/types';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register query endpoints with the MCP server
 * 
 * @param server - MCP server instance
 * @param queryService - Query service instance
 * @param validator - Schema validator instance
 */
export function registerQueryEndpoints(
  server: any,
  queryService: QueryService<UORContentItem>,
  validator: SchemaValidator
): void {
  /**
   * Execute a query
   */
  server.addMethod('query.execute', async (params: any, req: Request, res: Response) => {
    const { options, provider } = params;
    
    if (!options) {
      return {
        error: {
          code: 400,
          message: 'Missing query options'
        }
      };
    }
    
    try {
      const result = await queryService.execute(options, provider);
      return { result };
    } catch (error: unknown) {
      return {
        error: {
          code: 500,
          message: 'Failed to execute query',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Filter content
   */
  server.addMethod('query.filter', async (params: any, req: Request, res: Response) => {
    const { criteria, provider } = params;
    
    if (!criteria) {
      return {
        error: {
          code: 400,
          message: 'Missing filter criteria'
        }
      };
    }
    
    try {
      const result = await queryService.execute({ filter: criteria }, provider);
      return { result };
    } catch (error: unknown) {
      return {
        error: {
          code: 500,
          message: 'Failed to filter content',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Search content
   */
  server.addMethod('query.search', async (params: any, req: Request, res: Response) => {
    const { query, provider } = params;
    
    if (!query) {
      return {
        error: {
          code: 400,
          message: 'Missing search query'
        }
      };
    }
    
    try {
      const result = await queryService.execute({ search: query }, provider);
      return { result };
    } catch (error: unknown) {
      return {
        error: {
          code: 500,
          message: 'Failed to search content',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Paginate content
   */
  server.addMethod('query.paginate', async (params: any, req: Request, res: Response) => {
    const { options, filter, provider } = params;
    
    if (!options) {
      return {
        error: {
          code: 400,
          message: 'Missing pagination options'
        }
      };
    }
    
    try {
      const queryOptions: any = {
        pagination: options
      };
      
      if (filter) {
        queryOptions.filter = filter;
      }
      
      const result = await queryService.execute(queryOptions, provider);
      return { result };
    } catch (error: unknown) {
      return {
        error: {
          code: 500,
          message: 'Failed to paginate content',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Sort content
   */
  server.addMethod('query.sort', async (params: any, req: Request, res: Response) => {
    const { options, filter, provider } = params;
    
    if (!options) {
      return {
        error: {
          code: 400,
          message: 'Missing sort options'
        }
      };
    }
    
    try {
      const queryOptions: any = {
        sort: options
      };
      
      if (filter) {
        queryOptions.filter = filter;
      }
      
      const result = await queryService.execute(queryOptions, provider);
      return { result };
    } catch (error: unknown) {
      return {
        error: {
          code: 500,
          message: 'Failed to sort content',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
}
