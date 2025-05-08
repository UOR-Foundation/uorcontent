/**
 * UOR Tools Manager Tests
 */

import { UORToolsManager } from '../../../../src/mcp-server/services/tools-manager';
import { UORService } from '../../../../src/mcp-server/services/uor-service';

jest.mock('../../../../src/mcp-server/services/uor-service');
const MockedUORService = UORService as jest.MockedClass<typeof UORService>;

describe('UORToolsManager', () => {
  let manager: UORToolsManager;
  let mockUORService: jest.Mocked<UORService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUORService = new MockedUORService('http://localhost:3000/api') as jest.Mocked<UORService>;
    
    manager = new UORToolsManager(mockUORService);
  });

  describe('listTools', () => {
    it('should return tools', async () => {
      const result = await manager.listTools();
      
      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('get_concept_by_id');
    });
  });

  describe('callTool', () => {
    it('should call the get_concept_by_id tool', async () => {
      mockUORService.getConceptById.mockResolvedValueOnce({
        '@id': 'urn:uor:concept:test',
        name: 'Test Concept',
        '@type': 'DefinedTerm'
      });
      
      const result = await manager.callTool('get_concept_by_id', { id: 'urn:uor:concept:test' });
      
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({
        '@id': 'urn:uor:concept:test',
        name: 'Test Concept',
        '@type': 'DefinedTerm'
      });
    });

    it('should call the get_predicate_by_id tool', async () => {
      mockUORService.getPredicateById.mockResolvedValueOnce({
        '@id': 'urn:uor:predicate:test',
        name: 'Test Predicate',
        '@type': 'PropertyValue'
      });
      
      const result = await manager.callTool('get_predicate_by_id', { id: 'urn:uor:predicate:test' });
      
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({
        '@id': 'urn:uor:predicate:test',
        name: 'Test Predicate',
        '@type': 'PropertyValue'
      });
    });

    it('should call the get_topic_by_id tool', async () => {
      mockUORService.getTopicById.mockResolvedValueOnce({
        '@id': 'urn:uor:topic:test',
        name: 'Test Topic',
        '@type': 'CreativeWork'
      });
      
      const result = await manager.callTool('get_topic_by_id', { id: 'urn:uor:topic:test' });
      
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({
        '@id': 'urn:uor:topic:test',
        name: 'Test Topic',
        '@type': 'CreativeWork'
      });
    });

    it('should call the search_concepts tool', async () => {
      mockUORService.search.mockResolvedValueOnce([
        {
          '@id': 'urn:uor:concept:test',
          name: 'Test Concept',
          '@type': 'DefinedTerm'
        }
      ]);
      
      const result = await manager.callTool('search_concepts', { query: 'test' });
      
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual([
        {
          '@id': 'urn:uor:concept:test',
          name: 'Test Concept',
          '@type': 'DefinedTerm'
        }
      ]);
    });

    it('should handle unknown tools', async () => {
      await expect(manager.callTool('unknown_tool', {})).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle service errors', async () => {
      mockUORService.getConceptById.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await manager.callTool('get_concept_by_id', { id: 'urn:uor:concept:test' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network error');
    });
  });
});
