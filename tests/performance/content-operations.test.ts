/**
 * Content Operations Performance Tests
 * 
 * This file contains performance tests for content operations.
 */

import { ConceptManager } from '../../src/managers/concept-manager';
import { setupTestEnvironment } from '../utils/test-helpers';
import { createMockFileSystem } from '../utils/mocks';
import { Concept } from '../../src/models/types';
import { loadConceptFixture } from '../utils/fixture-loader';

describe('Content Operations Performance', () => {
  let conceptManager: ConceptManager;
  let fileSystem: ReturnType<typeof createMockFileSystem>;
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  
  beforeEach(() => {
    testEnv = setupTestEnvironment();
    fileSystem = createMockFileSystem();
    
    const schemaValidator = {
      validateConcept: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validatePartial: jest.fn().mockReturnValue({ valid: true, errors: [] })
    };
    
    conceptManager = new ConceptManager(fileSystem as any, schemaValidator as any, testEnv.contentDir);
  });
  
  afterEach(() => {
    testEnv.cleanup();
    jest.clearAllMocks();
  });
  
  describe('Bulk Operations', () => {
    it('should efficiently create multiple concepts', async () => {
      const conceptTemplate = loadConceptFixture('valid-concept.json');
      const concepts: Concept[] = [];
      
      for (let i = 0; i < 100; i++) {
        concepts.push({
          ...conceptTemplate,
          name: `Test Concept ${i}`,
          termCode: `TEST-${i.toString().padStart(3, '0')}`
        });
      }
      
      fileSystem.writeJsonFile.mockResolvedValue(undefined);
      
      const startTime = performance.now();
      
      await conceptManager.batchCreate(concepts as any);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
      expect(fileSystem.writeJsonFile).toHaveBeenCalledTimes(100);
    });
    
    it('should efficiently filter large datasets', async () => {
      const concepts: any[] = [];
      
      const conceptFiles: string[] = [];
      for (let i = 0; i < 1000; i++) {
        conceptFiles.push(`UOR-C-test${i}.json`);
      }
      
      fileSystem.listDirectory.mockResolvedValue(conceptFiles);
      
      for (let i = 0; i < 1000; i++) {
        const concept = {
          '@id': `urn:uor:concept:test${i}`,
          '@type': 'DefinedTerm',
          'name': `Test Concept ${i}`,
          'termCode': `TEST-${i.toString().padStart(3, '0')}`,
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': i % 2 === 0 ? 'Set A' : 'Set B'
          }
        };
        
        concepts.push(concept);
        fileSystem.readJsonFile.mockResolvedValueOnce(concept);
      }
      
      const startTime = performance.now();
      
      const filteredConcepts = await conceptManager.list({
        inDefinedTermSet: 'Set A'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(filteredConcepts.length).toBe(500); // Half of the concepts should be in Set A
    });
  });
  
  describe('Content Retrieval Performance', () => {
    it('should efficiently retrieve content by ID', async () => {
      const concept = loadConceptFixture('valid-concept.json');
      fileSystem.readJsonFile.mockResolvedValue(concept);
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await conceptManager.read('urn:uor:concept:test-concept');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;
      
      expect(avgDuration).toBeLessThan(2);
    });
  });
  
  describe('Content Update Performance', () => {
    it('should efficiently update content', async () => {
      const concept = loadConceptFixture('valid-concept.json');
      fileSystem.readJsonFile.mockResolvedValue(concept);
      fileSystem.writeJsonFile.mockResolvedValue(undefined);
      
      const iterations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await conceptManager.update('urn:uor:concept:test-concept', {
          '@type': 'DefinedTerm',
          description: `Updated description ${i}`
        } as any);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;
      
      expect(avgDuration).toBeLessThan(5);
    });
  });
  
  describe('Content Deletion Performance', () => {
    it('should efficiently delete content', async () => {
      const concept = loadConceptFixture('valid-concept.json');
      fileSystem.readJsonFile.mockResolvedValue(concept);
      fileSystem.deleteFile.mockResolvedValue(undefined);
      
      const iterations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await conceptManager.delete(`urn:uor:concept:test-concept-${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;
      
      expect(avgDuration).toBeLessThan(3);
    });
  });
});
