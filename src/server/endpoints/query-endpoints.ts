/**
 * Query Endpoints
 * 
 * Implements MCP server endpoints for Query Operations.
 * Provides JSON-RPC methods for filtering, searching, and paginating content.
 */

import { QueryService } from '../../query/query-service';
import { UORContentItem } from '../../models/types';

/**
 * Register query endpoints with the MCP server
 * 
 * @param server - MCP server instance
 * @param queryService - Query service instance
 * @param validator - Schema validator instance
 */
export function registerQueryEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  queryService: QueryService<UORContentItem>
): void {
  /**
   * Execute a query
   */
  server.addMethod('query.execute', async (params: unknown) => {
    const { options, provider } = params as { options: unknown; provider?: string };
    
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
  server.addMethod('query.filter', async (params: unknown) => {
    const { criteria, provider } = params as { criteria: unknown; provider?: string };
    
    if (!criteria) {
      return {
        error: {
          code: 400,
          message: 'Missing filter criteria'
        }
      };
    }
    
    try {
      const result = await queryService.execute({ filter: criteria as Record<string, unknown> }, provider);
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
  server.addMethod('query.search', async (params: unknown) => {
    const { query, provider } = params as { query: string; provider?: string };
    
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
  server.addMethod('query.paginate', async (params: unknown) => {
    const { options, filter, provider } = params as { 
      options: unknown; 
      filter?: Record<string, unknown>; 
      provider?: string 
    };
    
    if (!options) {
      return {
        error: {
          code: 400,
          message: 'Missing pagination options'
        }
      };
    }
    
    try {
      const queryOptions: Record<string, unknown> = {
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
  server.addMethod('query.sort', async (params: unknown) => {
    const { options, filter, provider } = params as { 
      options: unknown; 
      filter?: Record<string, unknown>; 
      provider?: string 
    };
    
    if (!options) {
      return {
        error: {
          code: 400,
          message: 'Missing sort options'
        }
      };
    }
    
    try {
      const queryOptions: Record<string, unknown> = {
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
