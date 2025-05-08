/**
 * MCP Validation Service Tests
 */

import { MCPValidationService } from '../../../../src/mcp-server/services/validation-service';

describe('MCPValidationService', () => {
  let service: MCPValidationService;

  beforeEach(() => {
    service = new MCPValidationService();
  });

  describe('validateResourceUri', () => {
    it('should validate valid URIs', () => {
      expect(service.validateResourceUri('uor://concept/test')).toBe(true);
      expect(service.validateResourceUri('uor://predicate/test')).toBe(true);
      expect(service.validateResourceUri('uor://topic/test')).toBe(true);
      expect(service.validateResourceUri('uor://resource/test')).toBe(true);
    });

    it('should invalidate invalid URIs', () => {
      expect(service.validateResourceUri('invalid')).toBe(false);
      expect(service.validateResourceUri('uor://invalid/test')).toBe(false);
      expect(service.validateResourceUri('uor://concept/')).toBe(false);
    });
  });

  describe('validateToolName', () => {
    it('should validate valid tool names', () => {
      expect(service.validateToolName('get_concept_by_id')).toBe(true);
      expect(service.validateToolName('get_predicate_by_id')).toBe(true);
      expect(service.validateToolName('get_topic_by_id')).toBe(true);
      expect(service.validateToolName('search_concepts')).toBe(true);
    });

    it('should invalidate invalid tool names', () => {
      expect(service.validateToolName('invalid')).toBe(false);
    });
  });

  describe('validateToolArguments', () => {
    it('should validate valid arguments for get_concept_by_id', () => {
      const result = service.validateToolArguments('get_concept_by_id', { id: 'test' });
      expect(result.valid).toBe(true);
    });

    it('should invalidate invalid arguments for get_concept_by_id', () => {
      const result = service.validateToolArguments('get_concept_by_id', {});
      expect(result.valid).toBe(false);
    });

    it('should validate valid arguments for search_concepts', () => {
      const result = service.validateToolArguments('search_concepts', { query: 'test' });
      expect(result.valid).toBe(true);
    });

    it('should invalidate invalid arguments for search_concepts', () => {
      const result = service.validateToolArguments('search_concepts', {});
      expect(result.valid).toBe(false);
    });

    it('should invalidate unknown tools', () => {
      const result = service.validateToolArguments('unknown', {});
      expect(result.valid).toBe(false);
    });
  });
});
