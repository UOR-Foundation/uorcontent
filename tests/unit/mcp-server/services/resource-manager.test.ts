/**
 * UOR Resource Manager Tests
 */

import { UORResourceManager } from '../../../../src/mcp-server/services/resource-manager';
import { UORService } from '../../../../src/mcp-server/services/uor-service';

jest.mock('../../../../src/mcp-server/services/uor-service');
const MockedUORService = UORService as jest.MockedClass<typeof UORService>;

describe('UORResourceManager', () => {
  let manager: UORResourceManager;
  let mockUORService: jest.Mocked<UORService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUORService = new MockedUORService('http://localhost:3000/api') as jest.Mocked<UORService>;
    
    manager = new UORResourceManager(mockUORService);
  });

  describe('listResources', () => {
    it('should return resources', async () => {
      mockUORService.getConcepts.mockResolvedValueOnce([
        { '@id': 'urn:uor:concept:test', name: 'Test Concept', description: 'A test concept', '@type': 'DefinedTerm' }
      ]);
      mockUORService.getPredicates.mockResolvedValueOnce([]);
      mockUORService.getTopics.mockResolvedValueOnce([]);
      mockUORService.getResources.mockResolvedValueOnce([]);
      
      const result = await manager.listResources();
      
      expect(result).toEqual([
        {
          uri: 'uor://concept/test',
          name: 'Test Concept',
          description: 'A test concept',
          mimeType: 'application/json'
        }
      ]);
    });

    it('should handle errors', async () => {
      mockUORService.getConcepts.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(manager.listResources()).rejects.toThrow('Failed to list resources');
    });
  });

  describe('listResourceTemplates', () => {
    it('should return resource templates', async () => {
      const result = await manager.listResourceTemplates();
      
      expect(result).toHaveLength(4);
      expect(result[0].uriTemplate).toBe('uor://concept/{id}');
    });
  });

  describe('readResource', () => {
    it('should read a concept resource', async () => {
      mockUORService.getConceptById.mockResolvedValueOnce({
        '@id': 'urn:uor:concept:test',
        name: 'Test Concept',
        '@type': 'DefinedTerm'
      });
      
      const result = await manager.readResource('uor://concept/test');
      
      expect(result).toHaveLength(1);
      expect(result[0].uri).toBe('uor://concept/test');
      expect(result[0].mimeType).toBe('application/json');
      expect(JSON.parse(result[0].text)).toEqual({
        '@id': 'urn:uor:concept:test',
        name: 'Test Concept',
        '@type': 'DefinedTerm'
      });
    });

    it('should handle invalid URI format', async () => {
      await expect(manager.readResource('invalid')).rejects.toThrow('Invalid URI format: invalid');
    });

    it('should handle unknown resource type', async () => {
      await expect(manager.readResource('uor://unknown/test')).rejects.toThrow('Unknown resource type: unknown');
    });

    it('should handle service errors', async () => {
      mockUORService.getConceptById.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(manager.readResource('uor://concept/test')).rejects.toThrow('Failed to read resource');
    });
  });
});
