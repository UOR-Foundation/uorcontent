/**
 * Concept Endpoints
 * 
 * Implements MCP server endpoints for Concept Manager operations.
 * Provides JSON-RPC methods for CRUD operations on concepts.
 */

import { ConceptManager } from '../../managers/concept-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register concept endpoints with the MCP server
 * 
 * @param server - MCP server instance
 * @param conceptManager - Concept manager instance
 * @param validator - Schema validator instance
 */
export function registerConceptEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  conceptManager: ConceptManager,
  validator: SchemaValidator
): void {
  /**
   * Create a new concept
   */
  server.addMethod('concept.create', async (params: unknown) => {
    const { concept } = params as { concept: Record<string, unknown> };
    
    const validationResult = validator.validateConcept(concept as any);
    if (!validationResult.valid) {
      return {
        error: {
          code: 400,
          message: 'Invalid concept',
          data: validationResult.errors
        }
      };
    }
    
    try {
      const createdConcept = await conceptManager.create(concept as any);
      return { result: createdConcept };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to create concept',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Read a concept by ID
   */
  server.addMethod('concept.read', async (params: unknown) => {
    const { id } = params as { id: string };
    
    if (!id) {
      return {
        error: {
          code: 400,
          message: 'Missing concept ID'
        }
      };
    }
    
    try {
      const concept = await conceptManager.read(id);
      
      if (!concept) {
        return {
          error: {
            code: 404,
            message: `Concept not found: ${id}`
          }
        };
      }
      
      return { result: concept };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to read concept',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Update a concept
   */
  server.addMethod('concept.update', async (params: unknown) => {
    const { id, updates, version } = params as { id: string; updates: Record<string, unknown>; version?: string };
    
    if (!id) {
      return {
        error: {
          code: 400,
          message: 'Missing concept ID'
        }
      };
    }
    
    if (!updates) {
      return {
        error: {
          code: 400,
          message: 'Missing concept updates'
        }
      };
    }
    
    const validationResult = validator.validatePartial(updates, 'DefinedTerm');
    if (!validationResult.valid) {
      return {
        error: {
          code: 400,
          message: 'Invalid concept updates',
          data: validationResult.errors
        }
      };
    }
    
    try {
      const updatedConcept = await conceptManager.update(id, updates as any, version);
      
      if (!updatedConcept) {
        return {
          error: {
            code: 404,
            message: `Concept not found: ${id}`
          }
        };
      }
      
      return { result: updatedConcept };
    } catch (error) {
      if (error instanceof Error && error.message.includes('was modified by another process')) {
        return {
          error: {
            code: 409,
            message: 'Concept was modified by another process',
            data: error.message
          }
        };
      }
      
      return {
        error: {
          code: 500,
          message: 'Failed to update concept',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Delete a concept
   */
  server.addMethod('concept.delete', async (params: unknown) => {
    const { id } = params as { id: string };
    
    if (!id) {
      return {
        error: {
          code: 400,
          message: 'Missing concept ID'
        }
      };
    }
    
    try {
      const deleted = await conceptManager.delete(id);
      
      if (!deleted) {
        return {
          error: {
            code: 404,
            message: `Concept not found: ${id}`
          }
        };
      }
      
      return { result: { success: true } };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to delete concept',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * List concepts with optional filtering
   */
  server.addMethod('concept.list', async (params: unknown) => {
    const { filter } = params as { filter?: Record<string, unknown> };
    
    try {
      const concepts = await conceptManager.list(filter);
      return { result: concepts };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to list concepts',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
  
  /**
   * Batch create concepts
   */
  server.addMethod('concept.batchCreate', async (params: unknown) => {
    const { concepts } = params as { concepts: unknown[] };
    
    if (!Array.isArray(concepts)) {
      return {
        error: {
          code: 400,
          message: 'Concepts must be an array'
        }
      };
    }
    
    for (let i = 0; i < concepts.length; i++) {
      const validationResult = validator.validateConcept(concepts[i] as any);
      if (!validationResult.valid) {
        return {
          error: {
            code: 400,
            message: `Invalid concept at index ${i}`,
            data: validationResult.errors
          }
        };
      }
    }
    
    try {
      const createdConcepts = await conceptManager.batchCreate(concepts as any);
      return { result: createdConcepts };
    } catch (error) {
      return {
        error: {
          code: 500,
          message: 'Failed to batch create concepts',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  });
}
