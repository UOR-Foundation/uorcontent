/**
 * Content Repository Tests
 * 
 * This file contains tests for the Content Repository core functionality.
 */

import { ContentRepository } from '../../../src/core/content-repository';
import { createMockFileSystem } from '../../utils/mocks';
import { setupTestEnvironment } from '../../utils/test-helpers';
import { UORContentItem } from '../../../src/models/types';

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

  describe('content operations', () => {
    it('should get content by ID', async () => {
      const contentId = 'urn:uor:concept:test-concept';
      const content = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': contentId,
        'name': 'Test Concept',
        'description': 'A test concept'
      };
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify(content));
      
      const result = await repository.getContentById(contentId);
      
      expect(mockFileSystem.readFile).toHaveBeenCalled();
      expect(result).toEqual(content);
    });

    it('should return null when content ID is not found', async () => {
      const contentId = 'urn:uor:concept:nonexistent';
      
      mockFileSystem.readFile.mockRejectedValueOnce(new Error('File not found'));
      
      const result = await repository.getContentById(contentId);
      
      expect(result).toBeNull();
    });

    it('should create new content', async () => {
      const content: UORContentItem = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'Test Concept',
        'description': 'A test concept'
      };
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      await repository.createContent(content);
      
      expect(mockFileSystem.writeFile).toHaveBeenCalled();
    });

    it('should update content by ID', async () => {
      const contentId = 'urn:uor:concept:test-concept';
      const existingContent: UORContentItem = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': contentId,
        'name': 'Test Concept',
        'description': 'A test concept',

      };
      
      const updatedContent = {
        ...existingContent,
        'description': 'Updated test concept'
      };
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify(existingContent));
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      const result = await repository.updateContent(contentId, { description: 'Updated test concept' });
      
      expect(mockFileSystem.writeFile).toHaveBeenCalled();
      expect(result).toEqual(updatedContent);
    });

    it('should delete content by ID', async () => {
      const contentId = 'urn:uor:concept:test-concept';
      const existingContent: UORContentItem = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': contentId,
        'name': 'Test Concept',
        'description': 'A test concept',

      };
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify(existingContent));
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: []
      }));
      
      const result = await repository.deleteContent(contentId);
      
      expect(mockFileSystem.deleteFile).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should get all content', async () => {
      const indexContent = {
        itemListElement: [
          {
            item: {
              '@context': 'https://schema.org',
              '@type': 'DefinedTerm',
              '@id': 'urn:uor:concept:test-concept-1',
              'name': 'Test Concept 1',
              'description': 'A test concept'
            }
          },
          {
            item: {
              '@context': 'https://schema.org',
              '@type': 'DefinedTerm',
              '@id': 'urn:uor:concept:test-concept-2',
              'name': 'Test Concept 2',
              'description': 'Another test concept'
            }
          }
        ]
      };
      
      mockFileSystem.readFile.mockResolvedValueOnce(JSON.stringify(indexContent));
      
      const result = await repository.getAllContent();
      
      expect(mockFileSystem.readFile).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Concept 1');
      expect(result[1].name).toBe('Test Concept 2');
    });
  });
});
