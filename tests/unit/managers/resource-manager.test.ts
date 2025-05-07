/**
 * Resource Manager Tests
 * 
 * This file contains tests for the Resource Manager.
 */

import { ResourceManager } from '../../../src/managers/resource-manager';
import { NodeFileSystem } from '../../../src/utils/file-system';
import { SchemaValidatorAdapter } from '../../../src/utils/schema-validator-adapter';
import { Resource, PartialResource } from '../../../src/models/types';
import { ValidationResult } from '../../../src/utils/schema-validation';

jest.mock('../../../src/utils/file-system');
jest.mock('../../../src/utils/file-system');
jest.mock('../../../src/utils/schema-validator-adapter');

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;
  let mockFileSystem: jest.Mocked<NodeFileSystem>;
  let mockValidator: jest.Mocked<SchemaValidatorAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileSystem = {
      writeJsonFile: jest.fn(),
      readJsonFile: jest.fn(),
      deleteFile: jest.fn(),
      listDirectory: jest.fn()
    } as unknown as jest.Mocked<NodeFileSystem>;
    
    mockValidator = {
      validateResource: jest.fn(),
      validatePartial: jest.fn(),
      validateContent: jest.fn(),
      validateConcept: jest.fn(),
      validatePredicate: jest.fn(),
      validateTopic: jest.fn(),
      validateRelationship: jest.fn()
    } as unknown as jest.Mocked<SchemaValidatorAdapter>;
    
    resourceManager = new ResourceManager(mockFileSystem, mockValidator);
  });

  describe('create', () => {
    it('should create a resource with valid data', async () => {
      const resourceData: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-R-001-test-resource',
        'name': 'Test Resource',
        'description': 'A test resource'
      };
      
      mockValidator.validateResource.mockReturnValue({ valid: true, errors: [] });
      
      mockFileSystem.writeJsonFile.mockResolvedValue(undefined);
      mockFileSystem.readJsonFile.mockResolvedValue(resourceData);
      
      const result = await resourceManager.create(resourceData);
      
      expect(mockValidator.validateResource).toHaveBeenCalledWith(expect.any(Object));
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toEqual(resourceData);
    });
    
    it('should throw an error if validation fails', async () => {
      const resourceData: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-R-001-test-resource',
        'name': 'Test Resource',
        'description': 'A test resource'
      };
      
      mockValidator.validateResource.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(resourceManager.create(resourceData)).rejects.toThrow('Validation error');
      expect(mockValidator.validateResource).toHaveBeenCalledWith(expect.any(Object));
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('read', () => {
    it('should read a resource by ID', async () => {
      const resourceId = 'UOR-R-001-test-resource';
      const resourceData: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': resourceId,
        'name': 'Test Resource',
        'description': 'A test resource'
      };
      
      mockFileSystem.readJsonFile.mockResolvedValue(resourceData);
      
      const result = await resourceManager.read(resourceId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(result).toEqual(resourceData);
    });
    
    it('should return null if resource does not exist', async () => {
      const resourceId = 'UOR-R-001-nonexistent';
      
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile.mockRejectedValue(error);
      
      const result = await resourceManager.read(resourceId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(result).toBeNull();
    });
  });
  
  describe('update', () => {
    it('should update a resource with valid data', async () => {
      const resourceId = 'UOR-R-001-test-resource';
      const existingResource: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': resourceId,
        'name': 'Test Resource',
        'description': 'A test resource'
      };
      
      const updates: PartialResource = {
        '@type': 'CreativeWork',
        'name': 'Updated Resource',
        'description': 'An updated test resource'
      };
      
      mockFileSystem.readJsonFile.mockResolvedValue(existingResource);
      mockFileSystem.writeJsonFile.mockResolvedValue(undefined);
      
      mockValidator.validateResource.mockReturnValue({ valid: true, errors: [] });
      mockValidator.validatePartial.mockReturnValue({ valid: true, errors: [] });
      
      const result = await resourceManager.update(resourceId, updates);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(expect.any(Object), 'CreativeWork');
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      
      expect(result).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': resourceId,
        'name': 'Updated Resource',
        'description': 'An updated test resource'
      });
      expect(result).toHaveProperty('dateModified');
    });
    
    it('should return null if resource does not exist', async () => {
      const resourceId = 'UOR-R-001-nonexistent';
      const updates: PartialResource = {
        '@type': 'CreativeWork',
        'name': 'Updated Resource'
      };
      
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile.mockRejectedValue(error);
      
      const result = await resourceManager.update(resourceId, updates);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(result).toBeNull();
    });
    
    it('should throw an error if validation fails', async () => {
      const resourceId = 'UOR-R-001-test-resource';
      const existingResource: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': resourceId,
        'name': 'Test Resource',
        'description': 'A test resource'
      };
      
      const updates: PartialResource = {
        '@type': 'CreativeWork',
        'name': 'Updated Resource'
      };
      
      mockFileSystem.readJsonFile.mockResolvedValue(existingResource);
      
      mockValidator.validatePartial.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(resourceManager.update(resourceId, updates)).rejects.toThrow('Invalid resource updates');
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(expect.any(Object), 'CreativeWork');
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should delete a resource by ID', async () => {
      const resourceId = 'UOR-R-001-test-resource';
      const existingResource: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': resourceId,
        'name': 'Test Resource'
      };
      
      mockFileSystem.readJsonFile.mockResolvedValue(existingResource);
      mockFileSystem.deleteFile.mockResolvedValue(undefined);
      
      const result = await resourceManager.delete(resourceId);
      
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(expect.stringContaining(resourceId));
      expect(result).toBe(true);
    });
    
    it('should return false if resource does not exist', async () => {
      const resourceId = 'UOR-R-001-nonexistent';
      
      mockFileSystem.readJsonFile.mockResolvedValue(null);
      
      const result = await resourceManager.delete(resourceId);
      
      expect(mockFileSystem.deleteFile).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('list', () => {
    it('should list all resources', async () => {
      const resources = [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': 'UOR-R-001-resource-1',
          'name': 'Resource 1'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': 'UOR-R-002-resource-2',
          'name': 'Resource 2'
        }
      ];
      
      mockFileSystem.listDirectory.mockResolvedValue([
        'UOR-R-001-resource-1.json',
        'UOR-R-002-resource-2.json'
      ]);
      
      mockFileSystem.readJsonFile.mockImplementation((path) => {
        if (path.includes('UOR-R-001-resource-1')) {
          return Promise.resolve(resources[0]);
        } else if (path.includes('UOR-R-002-resource-2')) {
          return Promise.resolve(resources[1]);
        }
        return Promise.reject(new Error('File not found'));
      });
      
      const result = await resourceManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledTimes(2);
      expect(result).toEqual(resources);
    });
    
    it('should return an empty array if no resources exist', async () => {
      mockFileSystem.listDirectory.mockResolvedValue([]);
      
      const result = await resourceManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
