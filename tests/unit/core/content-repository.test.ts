/**
 * Content Repository Tests
 * 
 * This file contains tests for the ContentRepository class.
 */

import { ContentRepository } from '../../../src/core/content-repository';
import { createMockFileSystem } from '../../utils/mocks';
import { setupTestEnvironment } from '../../utils/test-helpers';
import * as path from 'path';
import { UORContentItem, Concept } from '../../../src/models/types';

describe('ContentRepository', () => {
  let repository: ContentRepository;
  let mockFileSystem: ReturnType<typeof createMockFileSystem>;
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  
  beforeEach(() => {
    testEnv = setupTestEnvironment();
    mockFileSystem = createMockFileSystem();
    repository = new ContentRepository(mockFileSystem as any, testEnv.contentDir);
  });
  
  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });
  
  describe('getAllContent', () => {
    it('should get all content when no type is specified', async () => {
      const mockIndex = {
        itemListElement: [
          { item: { '@id': 'urn:uor:concept:test1', name: 'Test 1' } },
          { item: { '@id': 'urn:uor:concept:test2', name: 'Test 2' } }
        ]
      };
      
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockIndex));
      
      const result = await repository.getAllContent();
      
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(
        path.join(testEnv.contentDir, 'index.json')
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test 1');
    });
    
    it('should get content by type when type is specified', async () => {
      const mockIndex = {
        itemListElement: [
          { item: { '@id': 'urn:uor:concept:test1', name: 'Test 1' } },
          { item: { '@id': 'urn:uor:concept:test2', name: 'Test 2' } }
        ]
      };
      
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockIndex));
      
      const result = await repository.getAllContent('concept');
      
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(
        path.join(testEnv.contentDir, 'concepts-index.json')
      );
      expect(result).toHaveLength(2);
    });
  });
  
  describe('getContentById', () => {
    it('should get content by ID', async () => {
      const mockContent = {
        '@id': 'urn:uor:concept:test',
        '@type': 'DefinedTerm',
        'name': 'Test Concept'
      };
      
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockContent));
      
      const result = await repository.getContentById('urn:uor:concept:test');
      
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(
        path.join(testEnv.contentDir, 'concepts', 'UOR-C-test.json')
      );
      expect(result).toEqual(mockContent);
    });
    
    it('should return null for invalid ID format', async () => {
      const result = await repository.getContentById('invalid-id');
      
      expect(result).toBeNull();
      expect(mockFileSystem.readFile).not.toHaveBeenCalled();
    });
    
    it('should return null for unknown content type', async () => {
      const result = await repository.getContentById('urn:uor:unknown:test');
      
      expect(result).toBeNull();
      expect(mockFileSystem.readFile).not.toHaveBeenCalled();
    });
    
    it('should return null if file does not exist', async () => {
      mockFileSystem.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await repository.getContentById('urn:uor:concept:nonexistent');
      
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(
        path.join(testEnv.contentDir, 'concepts', 'UOR-C-nonexistent.json')
      );
      expect(result).toBeNull();
    });
  });
  
  describe('createContent', () => {
    it('should create new content', async () => {
      const mockContent: Concept = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'Test Concept',
        'termCode': 'TEST-001',
        'inDefinedTermSet': {
          '@type': 'DefinedTermSet',
          'name': 'Test Set'
        }
      };
      
      mockFileSystem.writeFile.mockResolvedValue(undefined);
      
      const updateIndexSpy = jest.spyOn(repository as any, 'updateIndex').mockResolvedValue(undefined);
      
      const result = await repository.createContent(mockContent);
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('uors/UOR-U-concept.json'),
        expect.any(String)
      );
      expect(updateIndexSpy).toHaveBeenCalled();
      expect(result['@id']).toBe('urn:uor:concept:test-concept');
    });
    
    it('should throw error for invalid content type', async () => {
      const mockContent = {
        '@context': 'https://schema.org',
        '@type': 'InvalidType',
        'name': 'Invalid Content'
      };
      
      await expect(repository.createContent(mockContent as any)).rejects.toThrow('Invalid content type');
    });
  });
  
  describe('updateContent', () => {
    it('should update existing content', async () => {
      const existingContent = {
        '@id': 'urn:uor:concept:test',
        '@type': 'DefinedTerm',
        'name': 'Test Concept',
        'description': 'Original description'
      };
      
      const updateData = {
        'description': 'Updated description'
      };
      
      jest.spyOn(repository, 'getContentById').mockResolvedValue(existingContent as any);
      
      mockFileSystem.writeFile.mockResolvedValue(undefined);
      
      const updateIndexSpy = jest.spyOn(repository as any, 'updateIndex').mockResolvedValue(undefined);
      
      const result = await repository.updateContent('urn:uor:concept:test', updateData);
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('uors/UOR-U-concept.json'),
        expect.any(String)
      );
      expect(updateIndexSpy).toHaveBeenCalled();
      expect(result?.description).toBe('Updated description');
    });
    
    it('should return null if content does not exist', async () => {
      jest.spyOn(repository, 'getContentById').mockResolvedValue(null);
      
      const result = await repository.updateContent('urn:uor:concept:nonexistent', { description: 'Updated' });
      
      expect(result).toBeNull();
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteContent', () => {
    it('should delete existing content', async () => {
      const existingContent = {
        '@id': 'urn:uor:concept:test',
        '@type': 'DefinedTerm',
        'name': 'Test Concept'
      };
      
      jest.spyOn(repository, 'getContentById').mockResolvedValue(existingContent as any);
      
      mockFileSystem.deleteFile.mockResolvedValue(undefined);
      
      const removeFromIndexSpy = jest.spyOn(repository as any, 'removeFromIndex').mockResolvedValue(undefined);
      
      const result = await repository.deleteContent('urn:uor:concept:test');
      
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('uors/UOR-U-concept.json')
      );
      expect(removeFromIndexSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false if content does not exist', async () => {
      jest.spyOn(repository, 'getContentById').mockResolvedValue(null);
      
      const result = await repository.deleteContent('urn:uor:concept:nonexistent');
      
      expect(result).toBe(false);
      expect(mockFileSystem.deleteFile).not.toHaveBeenCalled();
    });
  });
});
