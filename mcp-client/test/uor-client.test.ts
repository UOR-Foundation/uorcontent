import axios from 'axios';
import { UORClient } from '../src/uor-client';
import { UORConfig, UORResource, UORResourceTemplate, UORResourceContent, UORTool } from '../src/types';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UORClient', () => {
  let client: UORClient;
  const mockConfig: UORConfig = {
    baseUrl: 'https://test-api.example.com',
    apiKey: 'test-api-key',
    timeout: 5000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new UORClient(mockConfig);
    
    // Mock axios.create to return the mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('constructor', () => {
    it('should use default values when no config is provided', () => {
      const defaultClient = new UORClient();
      expect(mockedAxios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: 'https://uor.foundation/mcp',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }));
    });

    it('should use provided config values', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: mockConfig.baseUrl,
        timeout: mockConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockConfig.apiKey}`
        }
      }));
    });
  });

  describe('listResources', () => {
    it('should return a list of resources', async () => {
      const mockResponse = {
        data: {
          itemListElement: [
            {
              item: {
                '@id': 'urn:uor:resource:test-resource',
                name: 'Test Resource',
                description: 'A test resource'
              }
            }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.listResources();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/resources');
      expect(result).toEqual([
        {
          uri: 'uor://resource/test-resource',
          name: 'Test Resource',
          description: 'A test resource',
          mimeType: 'application/json'
        }
      ]);
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {}
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.listResources();
      
      expect(result).toEqual([]);
    });

    it('should throw an error when the API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      await expect(client.listResources()).rejects.toThrow('Failed to list resources');
    });
  });

  describe('listResourceTemplates', () => {
    it('should return a list of resource templates', async () => {
      const result = await client.listResourceTemplates();
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('uriTemplate');
      expect(result[0]).toHaveProperty('name');
    });
  });

  describe('readResource', () => {
    it('should read a concept resource', async () => {
      const mockResponse = {
        data: {
          '@id': 'urn:uor:concept:test-concept',
          name: 'Test Concept'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.readResource('uor://concept/test-concept');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/concepts/urn:uor:concept:test-concept');
      expect(result).toEqual([
        {
          uri: 'uor://concept/test-concept',
          mimeType: 'application/json',
          text: JSON.stringify(mockResponse.data, null, 2)
        }
      ]);
    });

    it('should read a predicate resource', async () => {
      const mockResponse = {
        data: {
          '@id': 'urn:uor:predicate:test-predicate',
          name: 'Test Predicate'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.readResource('uor://predicate/test-predicate');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/predicates/urn:uor:predicate:test-predicate');
      expect(result).toEqual([
        {
          uri: 'uor://predicate/test-predicate',
          mimeType: 'application/json',
          text: JSON.stringify(mockResponse.data, null, 2)
        }
      ]);
    });

    it('should throw an error for invalid URI format', async () => {
      await expect(client.readResource('invalid-uri')).rejects.toThrow('Invalid URI format');
    });

    it('should throw an error for unknown resource type', async () => {
      await expect(client.readResource('uor://unknown/test')).rejects.toThrow('Unknown resource type');
    });

    it('should throw a not found error when the resource is not found', async () => {
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      // Mock axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockImplementationOnce(() => true);
      mockedAxios.get.mockRejectedValueOnce(error);
      
      await expect(client.readResource('uor://concept/non-existent')).rejects.toThrow('Resource not found');
    });
  });

  describe('listTools', () => {
    it('should return a list of tools', async () => {
      const result = await client.listTools();
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('inputSchema');
    });
  });

  describe('callTool', () => {
    it('should call get_concept_by_id tool', async () => {
      const mockResponse = {
        data: {
          '@id': 'urn:uor:concept:test-concept',
          name: 'Test Concept'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.callTool('get_concept_by_id', { id: 'urn:uor:concept:test-concept' });
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/concepts/urn:uor:concept:test-concept');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse.data, null, 2)
          }
        ]
      });
    });

    it('should call get_predicate_by_id tool', async () => {
      const mockResponse = {
        data: {
          '@id': 'urn:uor:predicate:test-predicate',
          name: 'Test Predicate'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.callTool('get_predicate_by_id', { id: 'urn:uor:predicate:test-predicate' });
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/predicates/urn:uor:predicate:test-predicate');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse.data, null, 2)
          }
        ]
      });
    });

    it('should call get_topic_by_id tool', async () => {
      const mockResponse = {
        data: {
          '@id': 'urn:uor:topic:test-topic',
          name: 'Test Topic'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.callTool('get_topic_by_id', { id: 'urn:uor:topic:test-topic' });
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/topics/urn:uor:topic:test-topic');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse.data, null, 2)
          }
        ]
      });
    });

    it('should call search_concepts tool', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              '@id': 'urn:uor:concept:test-concept',
              name: 'Test Concept'
            }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await client.callTool('search_concepts', { query: 'test', limit: 10 });
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/search', {
        params: {
          q: 'test',
          type: 'concept',
          limit: 10
        }
      });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse.data, null, 2)
          }
        ]
      });
    });

    it('should handle not found errors for get_concept_by_id', async () => {
      // Create an Axios error with a 404 status
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      // Mock axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockImplementationOnce(() => true);
      mockedAxios.get.mockRejectedValueOnce(error);
      
      const result = await client.callTool('get_concept_by_id', { id: 'urn:uor:concept:non-existent' });
      
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Concept with ID urn:uor:concept:non-existent not found'
          }
        ],
        isError: true
      });
    });

    it('should handle not found errors for get_predicate_by_id', async () => {
      // Create an Axios error with a 404 status
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      // Mock axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockImplementationOnce(() => true);
      mockedAxios.get.mockRejectedValueOnce(error);
      
      const result = await client.callTool('get_predicate_by_id', { id: 'urn:uor:predicate:non-existent' });
      
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Predicate with ID urn:uor:predicate:non-existent not found'
          }
        ],
        isError: true
      });
    });

    it('should throw an error for get_predicate_by_id when API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      await expect(client.callTool('get_predicate_by_id', { id: 'urn:uor:predicate:test' }))
        .rejects.toThrow('Failed to get predicate');
    });

    it('should handle not found errors for get_topic_by_id', async () => {
      // Create an Axios error with a 404 status
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      // Mock axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockImplementationOnce(() => true);
      mockedAxios.get.mockRejectedValueOnce(error);
      
      const result = await client.callTool('get_topic_by_id', { id: 'urn:uor:topic:non-existent' });
      
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Topic with ID urn:uor:topic:non-existent not found'
          }
        ],
        isError: true
      });
    });

    it('should throw an error for get_topic_by_id when API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      await expect(client.callTool('get_topic_by_id', { id: 'urn:uor:topic:test' }))
        .rejects.toThrow('Failed to get topic');
    });

    it('should throw an error for search_concepts when API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      
      await expect(client.callTool('search_concepts', { query: 'test' }))
        .rejects.toThrow('Failed to search concepts');
    });

    it('should throw an error for unknown tool', async () => {
      await expect(client.callTool('unknown_tool', {})).rejects.toThrow('Unknown tool');
    });

    it('should throw an error when callTool encounters a non-McpError', async () => {
      // Mock the getConceptById method to throw a non-McpError
      mockedAxios.get.mockRejectedValueOnce(new Error('Unexpected error'));
      
      await expect(client.callTool('get_concept_by_id', { id: 'test' }))
        .rejects.toThrow('Failed to get concept');
    });
  });
});
