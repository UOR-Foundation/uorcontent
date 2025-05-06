/**
 * Index Endpoints
 * 
 * Implements MCP server endpoints for Index Management.
 * Provides JSON-RPC methods for index generation, updates, validation, and queries.
 */

import { Request, Response } from 'express';
import { IndexManager } from '../../index-management/index-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register index endpoints with the MCP server
 * 
 * @param server - MCP server instance
 * @param indexManager - Index manager instance
 * @param validator - Schema validator instance
 */
export function registerIndexEndpoints(
  server: any,
  indexManager: IndexManager,
  validator: SchemaValidator
): void {
  /**
   * Generate index for content type
   */
  server.addMethod('index.generate', async (params: any, req: Request, res: Response) => {
    const { contentType } = params;
    
    if (!contentType) {
      return {
        error: {
          code: 400,
          message: 'Missing content type'
        }
      };
    }
    
    try {
      await indexManager.generateIndex(contentType);
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to generate index',
          data: error.message
        }
      };
    }
  });
  
  /**
   * Update index with a single item
   */
  server.addMethod('index.update', async (params: any, req: Request, res: Response) => {
    const { contentType, id, item } = params;
    
    if (!contentType) {
      return {
        error: {
          code: 400,
          message: 'Missing content type'
        }
      };
    }
    
    if (!id) {
      return {
        error: {
          code: 400,
          message: 'Missing item ID'
        }
      };
    }
    
    try {
      await indexManager.updateIndex(contentType, id, item);
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to update index',
          data: error.message
        }
      };
    }
  });
  
  /**
   * Validate index for content type
   */
  server.addMethod('index.validate', async (params: any, req: Request, res: Response) => {
    const { contentType } = params;
    
    if (!contentType) {
      return {
        error: {
          code: 400,
          message: 'Missing content type'
        }
      };
    }
    
    try {
      const result = await indexManager.validateIndex(contentType);
      return { result };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to validate index',
          data: error.message
        }
      };
    }
  });
  
  /**
   * Repair index for content type
   */
  server.addMethod('index.repair', async (params: any, req: Request, res: Response) => {
    const { contentType } = params;
    
    if (!contentType) {
      return {
        error: {
          code: 400,
          message: 'Missing content type'
        }
      };
    }
    
    try {
      const result = await indexManager.repairIndex(contentType);
      return { result };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to repair index',
          data: error.message
        }
      };
    }
  });
  
  /**
   * Query index
   */
  server.addMethod('index.query', async (params: any, req: Request, res: Response) => {
    const { contentType, query } = params;
    
    if (!contentType) {
      return {
        error: {
          code: 400,
          message: 'Missing content type'
        }
      };
    }
    
    if (!query) {
      return {
        error: {
          code: 400,
          message: 'Missing query options'
        }
      };
    }
    
    try {
      const result = await indexManager.queryIndex(contentType, query);
      return { result };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to query index',
          data: error.message
        }
      };
    }
  });
  
  /**
   * Invalidate index cache
   */
  server.addMethod('index.invalidateCache', async (params: any, req: Request, res: Response) => {
    const { contentType } = params;
    
    try {
      indexManager.invalidateCache(contentType);
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to invalidate index cache',
          data: error.message
        }
      };
    }
  });
}
