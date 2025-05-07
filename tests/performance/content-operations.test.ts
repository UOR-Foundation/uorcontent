/**
 * Content Operations Performance Tests
 * 
 * This file contains performance tests for content operations.
 */

import { ContentRepository } from '../../src/core/content-repository';
import { ConceptManager } from '../../src/managers/concept-manager';
import { NodeFileSystem } from '../../src/utils/file-system';
import { SchemaValidatorAdapter } from '../../src/utils/schema-validator-adapter';
import { setupTestEnvironment } from '../utils/test-helpers';
import { Concept } from '../../src/models/types';
import * as path from 'path';
import * as fs from 'fs';

describe('Content Operations Performance', () => {
  let contentDir: string;
  let fileSystem: NodeFileSystem;
  let validator: SchemaValidatorAdapter;
  let repository: ContentRepository;
  let conceptManager: ConceptManager;
  let cleanup: () => void;
  
  beforeAll(() => {
    const testEnv = setupTestEnvironment();
    contentDir = testEnv.contentDir;
    cleanup = testEnv.cleanup;
    
    const dirs = [
      path.join(contentDir, 'concepts'),
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
  });
  
  afterAll(() => {
    cleanup();
  });
  
  afterEach(() => {
    const dirs = [
      path.join(contentDir, 'concepts')
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
  
  describe('Bulk Operations', () => {
    it('should handle bulk creation efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 50;
      const concepts: Concept[] = [];
      
      for (let i = 0; i < batchSize; i++) {
        concepts.push({
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': `Performance Test Concept ${i}`,
          'description': `Concept for performance testing ${i}`,
          'termCode': `PERF-${i.toString().padStart(3, '0')}`,
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Performance Test Set'
          }
        } as Concept);
      }
      
      const creationPromises = concepts.map(concept => conceptManager.create(concept));
      await Promise.all(creationPromises);
      
      const creationTime = Date.now() - startTime;
      console.log(`Created ${batchSize} concepts in ${creationTime}ms (${creationTime / batchSize}ms per concept)`);
      
      const allConcepts = await conceptManager.list();
      expect(allConcepts.length).toBe(batchSize);
      
      const retrievalStartTime = Date.now();
      const retrievalPromises = allConcepts.map(concept => 
        conceptManager.read(concept['@id']!.split(':').pop()!)
      );
      await Promise.all(retrievalPromises);
      
      const retrievalTime = Date.now() - retrievalStartTime;
      console.log(`Retrieved ${batchSize} concepts in ${retrievalTime}ms (${retrievalTime / batchSize}ms per concept)`);
      
      const updateStartTime = Date.now();
      const updatePromises = allConcepts.map(concept => 
        conceptManager.update(
          concept['@id']!.split(':').pop()!, 
          { '@type': 'DefinedTerm', description: `Updated description for ${concept.name}` } as any
        )
      );
      await Promise.all(updatePromises);
      
      const updateTime = Date.now() - updateStartTime;
      console.log(`Updated ${batchSize} concepts in ${updateTime}ms (${updateTime / batchSize}ms per concept)`);
      
      const deletionStartTime = Date.now();
      const deletionPromises = allConcepts.map(concept => 
        conceptManager.delete(concept['@id']!.split(':').pop()!)
      );
      await Promise.all(deletionPromises);
      
      const deletionTime = Date.now() - deletionStartTime;
      console.log(`Deleted ${batchSize} concepts in ${deletionTime}ms (${deletionTime / batchSize}ms per concept)`);
      
      const remainingConcepts = await conceptManager.list();
      expect(remainingConcepts.length).toBe(0);
      
      expect(creationTime / batchSize).toBeLessThan(100); // Less than 100ms per concept
      expect(retrievalTime / batchSize).toBeLessThan(50); // Less than 50ms per concept
      expect(updateTime / batchSize).toBeLessThan(100); // Less than 100ms per concept
      expect(deletionTime / batchSize).toBeLessThan(50); // Less than 50ms per concept
    }, 30000); // Increase timeout for performance tests
  });
  
  describe('Query Performance', () => {
    it('should efficiently filter large datasets', async () => {
      const batchSize = 100;
      const concepts: Concept[] = [];
      
      for (let i = 0; i < batchSize; i++) {
        const category = i % 5; // 5 different categories
        concepts.push({
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': `Category ${category} Concept ${i}`,
          'description': `Concept for performance testing ${i}`,
          'termCode': `PERF-${i.toString().padStart(3, '0')}`,
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': `Category ${category}`
          }
        } as Concept);
      }
      
      const creationPromises = concepts.map(concept => conceptManager.create(concept));
      await Promise.all(creationPromises);
      
      const filterStartTime = Date.now();
      const filteredConcepts = await conceptManager.list({ name: 'Category 0' });
      const filterTime = Date.now() - filterStartTime;
      
      console.log(`Filtered ${batchSize} concepts in ${filterTime}ms, found ${filteredConcepts.length} matches`);
      
      expect(filteredConcepts.length).toBe(batchSize / 5);
      
      expect(filterTime).toBeLessThan(500); // Less than 500ms for filtering
    }, 30000); // Increase timeout for performance tests
  });
});
