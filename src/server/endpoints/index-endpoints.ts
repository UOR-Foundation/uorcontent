/**
 * Index Endpoints
 * 
 * Implements MCP server endpoints for Index Management.
 * Provides JSON-RPC methods for index generation, updates, validation, and queries.
 */

import { IndexManager } from '../../index-management/index-manager';
import { SchemaValidator } from '../../utils/schema-validation';
import { UORContentItem } from '../../models/types';

/**
 * Register index endpoints with the MCP server
 * 
 * @param server - MCP server instance
 * @param indexManager - Index manager instance
 * @param validator - Schema validator instance
 */
export function registerIndexEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  indexManager: IndexManager,
  _validator: SchemaValidator
): void {
  /**
   * Generate index for content type
   */
  server.addMethod('index.generate', async (params: unknown) => {
    const { contentType } = params as { contentType: string };
    
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
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Update index with a single item
   */
  server.addMethod('index.update', async (params: unknown) => {
    const { contentType, id, item } = params as { contentType: string; id: string; item: unknown };
    
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
      await indexManager.updateIndex(contentType, id, item as unknown as UORContentItem);
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to update index',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Validate index for content type
   */
  server.addMethod('index.validate', async (params: unknown) => {
    const { contentType } = params as { contentType: string };
    
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
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Repair index for content type
   */
  server.addMethod('index.repair', async (params: unknown) => {
    const { contentType } = params as { contentType: string };
    
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
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Query index
   */
  server.addMethod('index.query', async (params: unknown) => {
    const { contentType, query } = params as { contentType: string; query: unknown };
    
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
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Invalidate index cache
   */
  server.addMethod('index.invalidateCache', async (params: unknown) => {
    const { contentType } = params as { contentType?: string };
    
    try {
      indexManager.invalidateCache(contentType);
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to invalidate index cache',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
}
