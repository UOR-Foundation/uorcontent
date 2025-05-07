/**
 * Content Management Integration Tests
 * 
 * This file contains integration tests for content management operations.
 */

import { ContentRepository } from '../../src/core/content-repository';
import { ConceptManager } from '../../src/managers/concept-manager';
import { ResourceManager } from '../../src/managers/resource-manager';
import { TopicManager } from '../../src/managers/topic-manager';
import { PredicateManager } from '../../src/managers/predicate-manager';
import { setupTestEnvironment } from '../utils/test-helpers';
import { loadConceptFixture, loadResourceFixture, loadTopicFixture, loadPredicateFixture } from '../utils/fixture-loader';
import { createMockFileSystem } from '../utils/mocks';

describe('Content Management Integration', () => {
  let contentRepository: ContentRepository;
  let conceptManager: ConceptManager;
  let resourceManager: ResourceManager;
  let topicManager: TopicManager;
  let predicateManager: PredicateManager;
  let fileSystem: ReturnType<typeof createMockFileSystem>;
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  
  beforeEach(() => {
    testEnv = setupTestEnvironment();
    fileSystem = createMockFileSystem();
    
    const schemaValidator = {
      validateConcept: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validateResource: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validateTopic: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validatePredicate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validatePartial: jest.fn().mockReturnValue({ valid: true, errors: [] })
    };
    
    contentRepository = new ContentRepository(fileSystem as any, testEnv.contentDir);
    conceptManager = new ConceptManager(fileSystem as any, schemaValidator as any, testEnv.contentDir);
    resourceManager = new ResourceManager(fileSystem as any, schemaValidator as any, testEnv.contentDir);
    topicManager = new TopicManager(fileSystem as any, schemaValidator as any, testEnv.contentDir);
    predicateManager = new PredicateManager(fileSystem as any, schemaValidator as any, testEnv.contentDir);
  });
  
  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });
  
  describe('Concept and Resource Integration', () => {
    it('should create a concept and associate it with a resource', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      const concept = await conceptManager.create(conceptFixture);
      
      const resourceFixture = loadResourceFixture('valid-resource.json');
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      const resource = await resourceManager.create(resourceFixture);
      
      const updatedResource = { 
        ...resource, 
        keywords: [...(resource.keywords || []), concept.name],
        dateModified: new Date().toISOString()
      };
      fileSystem.readJsonFile.mockResolvedValueOnce(resource);
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      const result = await resourceManager.update(resource['@id']!, {
        '@type': 'CreativeWork',
        'keywords': [...(resource.keywords || []), concept.name]
      });
      
      expect(result?.keywords).toContain(concept.name);
      
      fileSystem.readJsonFile.mockResolvedValueOnce(concept);
      fileSystem.readJsonFile.mockResolvedValueOnce(updatedResource);
      const retrievedConcept = await conceptManager.read(concept['@id']!);
      const retrievedResource = await resourceManager.read(resource['@id']!);
      
      expect(retrievedConcept).not.toBeNull();
      expect(retrievedResource).not.toBeNull();
      expect(retrievedResource?.keywords).toContain(concept.name);
    });
  });
  
  describe('Cross-Manager Operations', () => {
    it('should perform operations across multiple managers', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      const resourceFixture = loadResourceFixture('valid-resource.json');
      const topicFixture = loadTopicFixture('valid-topic.json');
      
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      fileSystem.writeJsonFile.mockResolvedValueOnce(undefined);
      
      const concept = await conceptManager.create(conceptFixture);
      const resource = await resourceManager.create(resourceFixture);
      const topic = await topicManager.create(topicFixture);
      
      expect(concept['@id']).toBeDefined();
      expect(resource['@id']).toBeDefined();
      expect(topic['@id']).toBeDefined();
      
      fileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: [
          { item: { '@id': concept['@id'], name: concept.name } },
          { item: { '@id': resource['@id'], name: resource.name } },
          { item: { '@id': topic['@id'], name: topic.name } }
        ]
      }));
      
      const allContent = await contentRepository.getAllContent();
      
      expect(allContent.some(item => item['@id'] === concept['@id'])).toBe(true);
      expect(allContent.some(item => item['@id'] === resource['@id'])).toBe(true);
      expect(allContent.some(item => item['@id'] === topic['@id'])).toBe(true);
      
      fileSystem.readJsonFile.mockResolvedValueOnce(concept);
      fileSystem.deleteFile.mockResolvedValueOnce(undefined);
      
      const deleteResult = await conceptManager.delete(concept['@id']!);
      expect(deleteResult).toBe(true);
      
      fileSystem.readFile.mockResolvedValueOnce(JSON.stringify({
        itemListElement: [
          { item: { '@id': resource['@id'], name: resource.name } },
          { item: { '@id': topic['@id'], name: topic.name } }
        ]
      }));
      
      const updatedContent = await contentRepository.getAllContent();
      expect(updatedContent.some(item => item['@id'] === concept['@id'])).toBe(false);
      expect(updatedContent.some(item => item['@id'] === resource['@id'])).toBe(true);
    });
  });
});
