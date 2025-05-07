/**
 * Predicate Manager Tests
 * 
 * This file contains tests for the Predicate Manager.
 */

import { PredicateManager } from '../../../src/managers/predicate-manager';
import { NodeFileSystem } from '../../../src/utils/file-system';
import { SchemaValidatorAdapter } from '../../../src/utils/schema-validator-adapter';
import { Predicate, PartialPredicate } from '../../../src/models/types';

jest.mock('../../../src/utils/file-system');
jest.mock('../../../src/utils/schema-validator-adapter');

describe('PredicateManager', () => {
  let predicateManager: PredicateManager;
  let mockFileSystem: jest.Mocked<NodeFileSystem>;
  let mockValidator: jest.Mocked<SchemaValidatorAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileSystem = new NodeFileSystem() as jest.Mocked<NodeFileSystem>;
    
    mockValidator = new SchemaValidatorAdapter(null as any) as jest.Mocked<SchemaValidatorAdapter>;
    
    mockValidator.validatePredicate = jest.fn().mockReturnValue({ valid: true, errors: [] });
    mockValidator.validatePartial = jest.fn().mockReturnValue({ valid: true, errors: [] });
    
    predicateManager = new PredicateManager(mockFileSystem, mockValidator);
  });

  describe('create', () => {
    it('should create a predicate with valid data', async () => {
      const predicateData: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': 'UOR-P-001-test-predicate',
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      mockValidator.validatePredicate.mockReturnValue({ valid: true, errors: [] });
      
      mockFileSystem.writeJsonFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await predicateManager.create(predicateData);
      
      expect(mockValidator.validatePredicate).toHaveBeenCalledWith(predicateData);
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        '@type': 'PropertyValue',
        'name': 'Test Predicate',
        'value': 'test-value'
      }));
    });
    
    it('should throw an error if validation fails', async () => {
      const predicateData: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': 'UOR-P-001-test-predicate',
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      mockValidator.validatePredicate.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(predicateManager.create(predicateData)).rejects.toThrow('Invalid predicate');
      expect(mockValidator.validatePredicate).toHaveBeenCalledWith(predicateData);
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('read', () => {
    it('should read a predicate by ID', async () => {
      const predicateId = 'UOR-P-001-test-predicate';
      const predicateData: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': predicateId,
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      mockFileSystem.readJsonFile = jest.fn().mockResolvedValue(predicateData);
      
      const result = await predicateManager.read(predicateId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(predicateId));
      expect(result).toEqual(predicateData);
    });
    
    it('should return null if predicate does not exist', async () => {
      const predicateId = 'UOR-P-001-nonexistent';
      
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile = jest.fn().mockRejectedValue(error);
      
      const result = await predicateManager.read(predicateId);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledWith(expect.stringContaining(predicateId));
      expect(result).toBeNull();
    });
  });
  
  describe('update', () => {
    it('should update a predicate with valid data', async () => {
      const predicateId = 'UOR-P-001-test-predicate';
      const existingPredicate: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': predicateId,
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      const updates: PartialPredicate = {
        '@type': 'PropertyValue',
        'name': 'Updated Predicate',
        'value': 'updated-value'
      };
      
      const updatedPredicate = {
        ...existingPredicate,
        ...updates,
        dateModified: expect.any(String)
      };
      
      predicateManager.read = jest.fn().mockResolvedValue(existingPredicate);
      
      mockValidator.validatePartial.mockReturnValue({ valid: true, errors: [] });
      
      mockFileSystem.writeJsonFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await predicateManager.update(predicateId, updates);
      
      expect(predicateManager.read).toHaveBeenCalledWith(predicateId);
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(updates, 'PropertyValue');
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        '@type': 'PropertyValue',
        'name': 'Updated Predicate',
        'value': 'updated-value'
      }));
    });
    
    it('should return null if predicate does not exist', async () => {
      const predicateId = 'UOR-P-001-nonexistent';
      const updates: PartialPredicate = {
        '@type': 'PropertyValue',
        'name': 'Updated Predicate'
      };
      
      predicateManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await predicateManager.update(predicateId, updates);
      
      expect(predicateManager.read).toHaveBeenCalledWith(predicateId);
      expect(result).toBeNull();
    });
    
    it('should throw an error if validation fails', async () => {
      const predicateId = 'UOR-P-001-test-predicate';
      const existingPredicate: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': predicateId,
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      const updates: PartialPredicate = {
        '@type': 'PropertyValue',
        'name': 'Updated Predicate'
      };
      
      predicateManager.read = jest.fn().mockResolvedValue(existingPredicate);
      
      mockValidator.validatePartial.mockReturnValue({ 
        valid: false, 
        errors: [{ message: 'Validation error', path: '/' }] 
      });
      
      await expect(predicateManager.update(predicateId, updates)).rejects.toThrow('Invalid predicate updates');
      expect(predicateManager.read).toHaveBeenCalledWith(predicateId);
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(updates, 'PropertyValue');
      expect(mockFileSystem.writeJsonFile).not.toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should delete a predicate by ID', async () => {
      const predicateId = 'UOR-P-001-test-predicate';
      const predicateData: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': predicateId,
        'name': 'Test Predicate',
        'value': 'test-value',
        'propertyID': 'test-property-id',
        'subjectOf': {
          '@id': 'UOR-C-001-test-concept'
        },
        'targetCollection': ['UOR-R-001-test-resource']
      };
      
      predicateManager.read = jest.fn().mockResolvedValue(predicateData);
      
      mockFileSystem.deleteFile = jest.fn().mockResolvedValue(undefined);
      
      const result = await predicateManager.delete(predicateId);
      
      expect(predicateManager.read).toHaveBeenCalledWith(predicateId);
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(expect.stringContaining(predicateId));
      expect(result).toBe(true);
    });
    
    it('should return false if predicate does not exist', async () => {
      const predicateId = 'UOR-P-001-nonexistent';
      
      predicateManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await predicateManager.delete(predicateId);
      
      expect(predicateManager.read).toHaveBeenCalledWith(predicateId);
      expect(mockFileSystem.deleteFile).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('list', () => {
    it('should list all predicates', async () => {
      const predicates = [
        {
          '@context': 'https://schema.org',
          '@type': 'PropertyValue',
          '@id': 'UOR-P-001-predicate-1',
          'name': 'Predicate 1',
          'value': 'value-1'
        },
        {
          '@context': 'https://schema.org',
          '@type': 'PropertyValue',
          '@id': 'UOR-P-002-predicate-2',
          'name': 'Predicate 2',
          'value': 'value-2'
        }
      ];
      
      mockFileSystem.listDirectory = jest.fn().mockResolvedValue([
        'UOR-P-001-predicate-1.json',
        'UOR-P-002-predicate-2.json'
      ]);
      
      mockFileSystem.readJsonFile = jest.fn()
        .mockImplementation((path) => {
          if (path.includes('UOR-P-001-predicate-1')) {
            return Promise.resolve(predicates[0]);
          } else if (path.includes('UOR-P-002-predicate-2')) {
            return Promise.resolve(predicates[1]);
          }
          return Promise.reject(new Error('File not found'));
        });
      
      const result = await predicateManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledTimes(2);
      expect(result).toEqual(predicates);
    });
    
    it('should return an empty array if no predicates exist', async () => {
      mockFileSystem.listDirectory = jest.fn().mockResolvedValue([]);
      
      const result = await predicateManager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
