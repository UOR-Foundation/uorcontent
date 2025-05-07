/**
 * Content Management Integration Tests
 * 
 * This file contains integration tests for the content management system,
 * testing the interaction between different components.
 */

import { ContentRepository } from '../../src/core/content-repository';
import { ConceptManager } from '../../src/managers/concept-manager';
import { PredicateManager } from '../../src/managers/predicate-manager';
import { ResourceManager } from '../../src/managers/resource-manager';
import { TopicManager } from '../../src/managers/topic-manager';
import { NodeFileSystem } from '../../src/utils/file-system';
import { SchemaValidatorAdapter } from '../../src/utils/schema-validator-adapter';
import { setupTestEnvironment, wait } from '../utils/test-helpers';
import { Concept, Predicate, Resource, Topic } from '../../src/models/types';
import * as path from 'path';
import * as fs from 'fs';

describe('Content Management Integration', () => {
  let contentDir: string;
  let fileSystem: NodeFileSystem;
  let validator: SchemaValidatorAdapter;
  let repository: ContentRepository;
  let conceptManager: ConceptManager;
  let predicateManager: PredicateManager;
  let resourceManager: ResourceManager;
  let topicManager: TopicManager;
  let cleanup: () => void;

  beforeAll(async () => {
    const testEnv = setupTestEnvironment();
    contentDir = testEnv.contentDir;
    cleanup = testEnv.cleanup;
    
    const dirs = [
      path.join(contentDir, 'concepts'),
      path.join(contentDir, 'predicates'),
      path.join(contentDir, 'resources'),
      path.join(contentDir, 'topics'),
      path.join(contentDir, 'indexes')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    fileSystem = new NodeFileSystem();
    validator = SchemaValidatorAdapter.createWithSingleton();
    
    repository = new ContentRepository(fileSystem, contentDir);
    conceptManager = new ConceptManager(fileSystem, validator, contentDir);
    predicateManager = new PredicateManager(fileSystem, validator, contentDir);
    resourceManager = new ResourceManager(fileSystem, validator, contentDir);
    topicManager = new TopicManager(fileSystem, validator, contentDir);
  });

  afterAll(() => {
    cleanup();
  });

  afterEach(async () => {
    const dirs = [
      path.join(contentDir, 'concepts'),
      path.join(contentDir, 'predicates'),
      path.join(contentDir, 'resources'),
      path.join(contentDir, 'topics')
    ];
    
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    }
  });

  describe('Content Creation and Relationships', () => {
    it('should create related content items and retrieve them', async () => {
      const concept: Concept = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'Integration Test Concept',
        'description': 'A concept for integration testing',
        'termCode': 'ITC-001',
        'inDefinedTermSet': {
          '@type': 'DefinedTermSet',
          'name': 'Test Term Set'
        }
      };
      
      const createdConcept = await conceptManager.create(concept);
      expect(createdConcept).toHaveProperty('@id');
      const conceptId = createdConcept['@id']!;
      
      const predicate: Predicate = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        'name': 'Integration Test Predicate',
        'description': 'A predicate for integration testing',
        'propertyID': 'ITP-001',
        'value': 'test-value',
        'subjectOf': {
          '@id': conceptId
        },
        'targetCollection': []
      };
      
      const createdPredicate = await predicateManager.create(predicate);
      expect(createdPredicate).toHaveProperty('@id');
      const predicateId = createdPredicate['@id']!;
      
      const resource: Resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': 'Integration Test Resource',
        'description': 'A resource for integration testing',
        'url': 'https://example.com/resource',
        'author': 'Test Author'
      };
      
      const createdResource = await resourceManager.create(resource);
      expect(createdResource).toHaveProperty('@id');
      const resourceId = createdResource['@id']!;
      
      const topic: Topic = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': 'Integration Test Topic',
        'description': 'A topic for integration testing',
        'about': [conceptId],
        'hasPart': [resourceId]
      };
      
      const createdTopic = await topicManager.create(topic);
      expect(createdTopic).toHaveProperty('@id');
      const topicId = createdTopic['@id']!;
      
      const retrievedConcept = await repository.getContentById(conceptId);
      expect(retrievedConcept).toHaveProperty('name', 'Integration Test Concept');
      
      const retrievedPredicate = await repository.getContentById(predicateId);
      expect(retrievedPredicate).toHaveProperty('name', 'Integration Test Predicate');
      
      const retrievedResource = await repository.getContentById(resourceId);
      expect(retrievedResource).toHaveProperty('name', 'Integration Test Resource');
      
      const retrievedTopic = await repository.getContentById(topicId);
      expect(retrievedTopic).toHaveProperty('name', 'Integration Test Topic');
      
      expect(retrievedTopic).toHaveProperty('about');
      expect((retrievedTopic as Topic).about).toContain(conceptId);
      
      expect(retrievedTopic).toHaveProperty('hasPart');
      expect((retrievedTopic as Topic).hasPart).toContain(resourceId);
      
      expect(retrievedPredicate).toHaveProperty('subjectOf');
      expect((retrievedPredicate as Predicate).subjectOf['@id']).toBe(conceptId);
    });
  });

  describe('Content Updates and Deletion', () => {
    it('should update and delete content items', async () => {
      const concept: Concept = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'Update Test Concept',
        'description': 'A concept for update testing',
        'termCode': 'UTC-001',
        'inDefinedTermSet': {
          '@type': 'DefinedTermSet',
          'name': 'Test Term Set'
        }
      };
      
      const createdConcept = await conceptManager.create(concept);
      const conceptId = createdConcept['@id']!;
      
      const updatedConcept = await conceptManager.update(
        conceptId.split(':').pop()!,
        { '@type': 'DefinedTerm', 'description': 'Updated description' }
      );
      
      expect(updatedConcept).toHaveProperty('description', 'Updated description');
      
      const retrievedConcept = await repository.getContentById(conceptId);
      expect(retrievedConcept).toHaveProperty('description', 'Updated description');
      
      const deleteResult = await conceptManager.delete(conceptId.split(':').pop()!);
      expect(deleteResult).toBe(true);
      
      const deletedConcept = await repository.getContentById(conceptId);
      expect(deletedConcept).toBeNull();
    });
  });

  describe('Content Listing and Filtering', () => {
    it('should list and filter content items', async () => {
      const concepts: Concept[] = [
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'List Test Concept 1',
          'description': 'First concept for list testing',
          'termCode': 'LTC-001',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        } as Concept,
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'List Test Concept 2',
          'description': 'Second concept for list testing',
          'termCode': 'LTC-002',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        } as Concept,
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'Another Test Concept',
          'description': 'Third concept for list testing',
          'termCode': 'LTC-003',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        } as Concept
      ];
      
      for (const concept of concepts) {
        await conceptManager.create(concept);
      }
      
      const allConcepts = await conceptManager.list();
      expect(allConcepts).toHaveLength(3);
      
      const filteredConcepts = await conceptManager.list({ name: 'List' });
      expect(filteredConcepts).toHaveLength(2);
      
      const allContent = await repository.getAllContent();
      expect(allContent.length).toBeGreaterThanOrEqual(3);
    });
  });
});
