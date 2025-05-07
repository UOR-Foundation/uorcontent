/**
 * Topic Manager Tests
 * 
 * This file contains tests for the Topic Manager.
 */

import { TopicManager } from '../../../src/managers/topic-manager';
import { NodeFileSystem } from '../../../src/utils/file-system';
import { SchemaValidatorAdapter } from '../../../src/utils/schema-validator-adapter';
import { Topic, PartialTopic } from '../../../src/models/types';

jest.mock('../../../src/utils/file-system');
jest.mock('../../../src/utils/schema-validator-adapter');

describe('TopicManager', () => {
  let topicManager: TopicManager;
  let mockFileSystem: jest.Mocked<NodeFileSystem>;
  let mockValidator: jest.Mocked<SchemaValidatorAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileSystem = new NodeFileSystem() as jest.Mocked<NodeFileSystem>;
    
    mockValidator = new SchemaValidatorAdapter(null as any) as jest.Mocked<SchemaValidatorAdapter>;
    
    mockValidator.validateTopic = jest.fn().mockReturnValue({ valid: true, errors: [] });
    mockValidator.validatePartial = jest.fn().mockReturnValue({ valid: true, errors: [] });
    
    topicManager = new TopicManager(mockFileSystem, mockValidator);
  });

  describe('create', () => {
    it('should create a topic with valid data', async () => {
      const topicData: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-T-001-test-topic',
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      mockValidator.validateTopic.mockReturnValue({ valid: true, errors: [] });
      
      mockFileSystem.writeJsonFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await topicManager.create(topicData);
      
      expect(mockValidator.validateTopic).toHaveBeenCalledWith(topicData);
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        '@type': 'CreativeWork',
        'name': 'Test Topic',
        'description': 'A test topic'
      }));
    });
    
    it('should throw an error if validation fails', async () => {
      const topicData: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-T-001-test-topic',
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      mockValidator.validateTopic.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(topicManager.create(topicData)).rejects.toThrow('Invalid topic');
      expect(mockValidator.validateTopic).toHaveBeenCalledWith(topicData);
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('read', () => {
    it('should read a topic by ID', async () => {
      const topicId = 'UOR-T-001-test-topic';
      const topicData: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': topicId,
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      mockFileSystem.readJsonFile = jest.fn().mockResolvedValue(topicData);
      
      const result = await topicManager.read(topicId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(topicId));
      expect(result).toEqual(topicData);
    });
    
    it('should return null if topic does not exist', async () => {
      const topicId = 'UOR-T-001-nonexistent';
      
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile = jest.fn().mockRejectedValue(error);
      
      const result = await topicManager.read(topicId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(topicId));
      expect(result).toBeNull();
    });
  });
  
  describe('update', () => {
    it('should update a topic with valid data', async () => {
      const topicId = 'UOR-T-001-test-topic';
      const existingTopic: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': topicId,
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      const updates: PartialTopic = {
        '@type': 'CreativeWork',
        'name': 'Updated Topic',
        'description': 'An updated test topic'
      };
      
      const updatedTopic = {
        ...existingTopic,
        ...updates,
        dateModified: expect.any(String)
      };
      
      topicManager.read = jest.fn().mockResolvedValue(existingTopic);
      
      mockValidator.validatePartial.mockReturnValue({ valid: true, errors: [] });
      
      mockFileSystem.writeJsonFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await topicManager.update(topicId, updates);
      
      expect(topicManager.read).toHaveBeenCalledWith(topicId);
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(updates, 'CreativeWork');
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        '@type': 'CreativeWork',
        'name': 'Updated Topic',
        'description': 'An updated test topic'
      }));
    });
    
    it('should return null if topic does not exist', async () => {
      const topicId = 'UOR-T-001-nonexistent';
      const updates: PartialTopic = {
        '@type': 'CreativeWork',
        'name': 'Updated Topic'
      };
      
      topicManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await topicManager.update(topicId, updates);
      
      expect(topicManager.read).toHaveBeenCalledWith(topicId);
      expect(result).toBeNull();
    });
    
    it('should throw an error if validation fails', async () => {
      const topicId = 'UOR-T-001-test-topic';
      const existingTopic: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': topicId,
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      const updates: PartialTopic = {
        '@type': 'CreativeWork',
        'name': 'Updated Topic'
      };
      
      topicManager.read = jest.fn().mockResolvedValue(existingTopic);
      
      mockValidator.validatePartial.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(topicManager.update(topicId, updates)).rejects.toThrow('Invalid topic updates');
      expect(topicManager.read).toHaveBeenCalledWith(topicId);
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(updates, 'CreativeWork');
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should delete a topic by ID', async () => {
      const topicId = 'UOR-T-001-test-topic';
      const topicData: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': topicId,
        'name': 'Test Topic',
        'description': 'A test topic'
      };
      
      topicManager.read = jest.fn().mockResolvedValue(topicData);
      
      mockFileSystem.deleteFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await topicManager.delete(topicId);
      
      expect(topicManager.read).toHaveBeenCalledWith(topicId);
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(expect.stringContaining(topicId));
      expect(result).toBe(true);
    });
    
    it('should return false if topic does not exist', async () => {
      const topicId = 'UOR-T-001-nonexistent';
      
      topicManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await topicManager.delete(topicId);
      
      expect(topicManager.read).toHaveBeenCalledWith(topicId);
      expect(mockFileSystem.deleteFile).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('list', () => {
    it('should list all topics', async () => {
      const topics = [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': 'UOR-T-001-topic-1',
          'name': 'Topic 1'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': 'UOR-T-002-topic-2',
          'name': 'Topic 2'
        }
      ];
      
      mockFileSystem.listDirectory = jest.fn().mockResolvedValue([
        'UOR-T-001-topic-1.json',
        'UOR-T-002-topic-2.json'
      ]);
      
      mockFileSystem.readJsonFile = jest.fn()
        .mockImplementation((path) => {
          if (path.includes('UOR-T-001-topic-1')) {
            return Promise.resolve(topics[0]);
          } else if (path.includes('UOR-T-002-topic-2')) {
            return Promise.resolve(topics[1]);
          }
          return Promise.reject(new Error('File not found'));
        });
      
      const result = await topicManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledTimes(2);
      expect(result).toEqual(topics);
    });
    
    it('should return an empty array if no topics exist', async () => {
      mockFileSystem.listDirectory = jest.fn().mockResolvedValue([]);
      
      const result = await topicManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
