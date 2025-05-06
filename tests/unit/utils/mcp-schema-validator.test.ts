/**
 * MCP Schema Validator Tests
 * 
 * This file contains tests for the MCP Schema Validator.
 */

import { MCPSchemaValidator } from '../../../src/server/utils/mcp-schema-validator';

describe('MCPSchemaValidator', () => {
  let validator: MCPSchemaValidator;

  beforeEach(() => {
    validator = MCPSchemaValidator.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = MCPSchemaValidator.getInstance();
      const instance2 = MCPSchemaValidator.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the validator', async () => {
      await validator.initialize();
      
      const spy = jest.spyOn(validator as any, 'initialized', 'get');
      
      await validator.initialize();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('validateRequest', () => {
    beforeEach(async () => {
      await validator.initialize();
    });

    it('should validate a valid GET request', async () => {
      const result = await validator.validateRequest(
        'GET',
        '/api/concepts',
        {}
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate a valid POST request', async () => {
      const result = await validator.validateRequest(
        'POST',
        '/api/concepts',
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'content.create',
          params: {
            content: {
              '@context': 'https://schema.org',
              '@type': 'DefinedTerm',
              name: 'Test Concept',
              description: 'A test concept'
            }
          }
        }
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return valid=true for unknown endpoints', async () => {
      const result = await validator.validateRequest(
        'GET',
        '/api/unknown',
        {}
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});
