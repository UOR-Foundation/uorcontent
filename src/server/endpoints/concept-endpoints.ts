/**
 * Concept Endpoints
 * 
 * Implements MCP server endpoints for Concept Manager operations.
 * Provides JSON-RPC methods for CRUD operations on concepts.
 */

import { Request, Response } from 'express';
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
  server: any,
  conceptManager: ConceptManager,
  validator: SchemaValidator
): void {
  /**
   * Create a new concept
   */
  server.addMethod('concept.create', async (params: any, req: Request, res: Response) => {
    const { concept } = params;
    
    const validationResult = validator.validateConcept(concept);
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
      const createdConcept = await conceptManager.create(concept);
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
  server.addMethod('concept.read', async (params: any, req: Request, res: Response) => {
    const { id } = params;
    
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
  server.addMethod('concept.update', async (params: any, req: Request, res: Response) => {
    const { id, updates, version } = params;
    
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
      const updatedConcept = await conceptManager.update(id, updates, version);
      
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
  server.addMethod('concept.delete', async (params: any, req: Request, res: Response) => {
    const { id } = params;
    
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
  server.addMethod('concept.list', async (params: any, req: Request, res: Response) => {
    const { filter } = params;
    
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
  server.addMethod('concept.batchCreate', async (params: any, req: Request, res: Response) => {
    const { concepts } = params;
    
    if (!Array.isArray(concepts)) {
      return {
        error: {
          code: 400,
          message: 'Concepts must be an array'
        }
      };
    }
    
    for (let i = 0; i < concepts.length; i++) {
      const validationResult = validator.validateConcept(concepts[i]);
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
      const createdConcepts = await conceptManager.batchCreate(concepts);
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
