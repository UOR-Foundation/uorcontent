/**
 * UOR Service Tests
 */

import axios from 'axios';
import { UORService } from '../../../../src/mcp-server/services/uor-service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UORService', () => {
  let service: UORService;
  const baseUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as any);
    
    service = new UORService(baseUrl);
  });

  describe('getConcepts', () => {
    it('should return concepts', async () => {
      const mockConcepts = {
        data: {
          itemListElement: [
            { item: { '@id': 'urn:uor:concept:test', name: 'Test Concept' } }
          ]
        }
      };
      
      mockedAxios.create().get.mockResolvedValueOnce(mockConcepts);
      
      const result = await service.getConcepts();
      
      expect(result).toEqual([{ '@id': 'urn:uor:concept:test', name: 'Test Concept' }]);
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/concepts');
    });

    it('should handle errors', async () => {
      mockedAxios.create().get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(service.getConcepts()).rejects.toThrow('Failed to get concepts');
    });
  });

  describe('getConceptById', () => {
    it('should return a concept by ID', async () => {
      const mockConcept = {
        data: { '@id': 'urn:uor:concept:test', name: 'Test Concept' }
      };
      
      mockedAxios.create().get.mockResolvedValueOnce(mockConcept);
      
      const result = await service.getConceptById('urn:uor:concept:test');
      
      expect(result).toEqual({ '@id': 'urn:uor:concept:test', name: 'Test Concept' });
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/concepts/urn:uor:concept:test');
    });

    it('should handle errors', async () => {
      mockedAxios.create().get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(service.getConceptById('urn:uor:concept:test')).rejects.toThrow('Failed to get concept with ID urn:uor:concept:test');
    });
  });

  describe('search', () => {
    it('should search for content', async () => {
      const mockResults = {
        data: {
          itemListElement: [
            { item: { '@id': 'urn:uor:concept:test', name: 'Test Concept' } }
          ]
        }
      };
      
      mockedAxios.create().get.mockResolvedValueOnce(mockResults);
      
      const result = await service.search('test', 'concept', 10);
      
      expect(result).toEqual([{ '@id': 'urn:uor:concept:test', name: 'Test Concept' }]);
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/search', {
        params: {
          q: 'test',
          type: 'concept',
          limit: 10
        }
      });
    });

    it('should handle errors', async () => {
      mockedAxios.create().get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(service.search('test')).rejects.toThrow('Failed to search');
    });
  });
});
