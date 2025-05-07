/**
 * Concept Manager Tests
 * 
 * This file contains tests for the Concept Manager functionality.
 */

import { ConceptManager, ConceptEventType } from '../../../src/managers/concept-manager';
import { createMockFileSystem, createMockSchemaValidator } from '../../utils/mocks';
import { setupTestEnvironment } from '../../utils/test-helpers';
import { loadFixture } from '../../utils/fixture-loader';
import { Concept } from '../../../src/models/types';

describe('ConceptManager', () => {
  let manager: ConceptManager;
  let mockFileSystem: ReturnType<typeof createMockFileSystem>;
  let mockValidator: ReturnType<typeof createMockSchemaValidator>;
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  let validConcept: Concept;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    mockFileSystem = createMockFileSystem();
    mockValidator = createMockSchemaValidator();
    
    manager = new ConceptManager(
      mockFileSystem as any,
      mockValidator as any,
      testEnv.contentDir
    );
    
    validConcept = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      '@id': 'urn:uor:concept:test-concept',
      'name': 'Test Concept',
      'description': 'A test concept for unit testing',
      'termCode': 'TEST-001',
      'inDefinedTermSet': {
        '@type': 'DefinedTermSet',
        'name': 'Test Term Set'
      }
    };
  });

  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });

  describe('read', () => {
    it('should get a concept by ID', async () => {
      mockFileSystem.readJsonFile.mockResolvedValueOnce(validConcept);
      
      const result = await manager.read('test-concept');
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(result).toEqual(validConcept);
    });

    it('should return null when concept is not found', async () => {
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile.mockRejectedValueOnce(error);
      
      const result = await manager.read('nonexistent');
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new concept', async () => {
      mockValidator.validateConcept.mockReturnValueOnce({ valid: true, errors: [] });
      mockFileSystem.writeJsonFile.mockResolvedValueOnce();
      
      const result = await manager.create(validConcept);
      
      expect(mockValidator.validateConcept).toHaveBeenCalledWith(validConcept);
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toHaveProperty('@id');
      expect(result).toHaveProperty('dateCreated');
      expect(result).toHaveProperty('dateModified');
    });

    it('should throw an error when creating an invalid concept', async () => {
      const invalidConcept = { ...validConcept, '@type': 'InvalidType' };
      
      mockValidator.validateConcept.mockReturnValueOnce({ 
        valid: false, 
        errors: ['Invalid type'] as string[]
      });
      
      await expect(manager.create(invalidConcept as any)).rejects.toThrow('Invalid concept');
    });
  });

  describe('update', () => {
    it('should update an existing concept', async () => {
      const updates = { '@type': 'DefinedTerm', description: 'Updated test concept' } as import('../../../src/models/types').PartialConcept;
      
      mockFileSystem.readJsonFile.mockResolvedValueOnce(validConcept);
      mockValidator.validatePartial.mockReturnValueOnce({ valid: true, errors: [] });
      mockFileSystem.writeJsonFile.mockResolvedValueOnce();
      
      const result = await manager.update('test-concept', updates);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(mockValidator.validatePartial).toHaveBeenCalledWith(updates, 'DefinedTerm');
      expect(mockFileSystem.writeJsonFile).toHaveBeenCalled();
      expect(result).toHaveProperty('description', 'Updated test concept');
      expect(result).toHaveProperty('dateModified');
    });

    it('should return null when concept to update is not found', async () => {
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile.mockRejectedValueOnce(error);
      
      const result = await manager.update('nonexistent', { '@type': 'DefinedTerm', description: 'Updated test concept' } as import('../../../src/models/types').PartialConcept);
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a concept by ID', async () => {
      mockFileSystem.readJsonFile.mockResolvedValueOnce(validConcept);
      mockFileSystem.deleteFile.mockResolvedValueOnce();
      
      const result = await manager.delete('test-concept');
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(mockFileSystem.deleteFile).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when concept to delete is not found', async () => {
      const error = new Error('File not found');
      error.name = 'FileNotFoundError';
      mockFileSystem.readJsonFile.mockRejectedValueOnce(error);
      
      const result = await manager.delete('nonexistent');
      
      expect(mockFileSystem.readJsonFile).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should get all concepts', async () => {
      const concepts = [
        validConcept, 
        { ...validConcept, '@id': 'urn:uor:concept:test-concept-2', 'name': 'Test Concept 2' }
      ];
      
      mockFileSystem.listDirectory.mockResolvedValueOnce(['UOR-C-test-concept.json', 'UOR-C-test-concept-2.json']);
      mockFileSystem.readJsonFile.mockResolvedValueOnce(concepts[0]);
      mockFileSystem.readJsonFile.mockResolvedValueOnce(concepts[1]);
      
      const result = await manager.list();
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should filter concepts by name', async () => {
      const concepts = [
        validConcept, 
        { ...validConcept, '@id': 'urn:uor:concept:test-concept-2', 'name': 'Another Concept' }
      ];
      
      mockFileSystem.listDirectory.mockResolvedValueOnce(['UOR-C-test-concept.json', 'UOR-C-test-concept-2.json']);
      mockFileSystem.readJsonFile.mockResolvedValueOnce(concepts[0]);
      mockFileSystem.readJsonFile.mockResolvedValueOnce(concepts[1]);
      
      const result = await manager.list({ name: 'Test' });
      
      expect(mockFileSystem.listDirectory).toHaveBeenCalled();
      expect(mockFileSystem.readJsonFile).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Concept');
    });
  });

  describe('event handling', () => {
    it('should add and remove event listeners', () => {
      const listener = jest.fn();
      
      manager.addEventListener(ConceptEventType.CREATED, listener);
      
      mockValidator.validateConcept.mockReturnValueOnce({ valid: true, errors: [] });
      mockFileSystem.writeJsonFile.mockResolvedValueOnce();
      
      manager.create(validConcept);
      
      expect(listener).toHaveBeenCalled();
      
      manager.removeEventListener(ConceptEventType.CREATED, listener);
      
      listener.mockReset();
      
      mockValidator.validateConcept.mockReturnValueOnce({ valid: true, errors: [] });
      mockFileSystem.writeJsonFile.mockResolvedValueOnce();
      
      manager.create(validConcept);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
