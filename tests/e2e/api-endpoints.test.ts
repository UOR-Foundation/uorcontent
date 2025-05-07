/**
 * API Endpoints End-to-End Tests
 * 
 * This file contains end-to-end tests for the API endpoints.
 */

import * as request from 'supertest';
import { Server } from 'http';
import { createServer } from '../../src/server/server';
import { setupTestEnvironment } from '../utils/test-helpers';
import * as path from 'path';
import * as fs from 'fs';

describe('API Endpoints', () => {
  let server: Server;
  let app: Express.Application;
  let contentDir: string;
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
    
    app = await createServer({
      contentDir,
      port: 0,
      logLevel: 'silent'
    });
    
    server = app.listen(0);
  });
  
  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
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
  
  describe('Concept API', () => {
    it('should create, read, update, and delete a concept', async () => {
      const concept = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        'name': 'E2E Test Concept',
        'description': 'A concept for E2E testing',
        'termCode': 'E2E-001',
        'inDefinedTermSet': {
          '@type': 'DefinedTermSet',
          'name': 'Test Term Set'
        }
      };
      
      const createResponse = await request(app)
        .post('/api/concepts')
        .send(concept)
        .expect(201);
      
      const conceptId = createResponse.body['@id'].split(':').pop();
      expect(createResponse.body.name).toBe('E2E Test Concept');
      
      const readResponse = await request(app)
        .get(`/api/concepts/${conceptId}`)
        .expect(200);
      
      expect(readResponse.body.name).toBe('E2E Test Concept');
      
      const updateResponse = await request(app)
        .patch(`/api/concepts/${conceptId}`)
        .send({
          '@type': 'DefinedTerm',
          'description': 'Updated E2E test concept'
        })
        .expect(200);
      
      expect(updateResponse.body.description).toBe('Updated E2E test concept');
      
      await request(app)
        .delete(`/api/concepts/${conceptId}`)
        .expect(204);
      
      await request(app)
        .get(`/api/concepts/${conceptId}`)
        .expect(404);
    });
    
    it('should list and filter concepts', async () => {
      const concepts = [
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'E2E List Concept 1',
          'description': 'First concept for E2E list testing',
          'termCode': 'E2E-L-001',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'E2E List Concept 2',
          'description': 'Second concept for E2E list testing',
          'termCode': 'E2E-L-002',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          'name': 'Another E2E Concept',
          'description': 'Third concept for E2E list testing',
          'termCode': 'E2E-L-003',
          'inDefinedTermSet': {
            '@type': 'DefinedTermSet',
            'name': 'Test Term Set'
          }
        }
      ];
      
      for (const concept of concepts) {
        await request(app)
          .post('/api/concepts')
          .send(concept)
          .expect(201);
      }
      
      const listResponse = await request(app)
        .get('/api/concepts')
        .expect(200);
      
      expect(listResponse.body).toHaveLength(3);
      
      const filteredResponse = await request(app)
        .get('/api/concepts?name=List')
        .expect(200);
      
      expect(filteredResponse.body).toHaveLength(2);
    });
  });
  
  describe('Resource API', () => {
    it('should create, read, update, and delete a resource', async () => {
      const resource = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': 'E2E Test Resource',
        'description': 'A resource for E2E testing',
        'url': 'https://example.com/resource',
        'author': 'Test Author'
      };
      
      const createResponse = await request(app)
        .post('/api/resources')
        .send(resource)
        .expect(201);
      
      const resourceId = createResponse.body['@id'].split(':').pop();
      expect(createResponse.body.name).toBe('E2E Test Resource');
      
      const readResponse = await request(app)
        .get(`/api/resources/${resourceId}`)
        .expect(200);
      
      expect(readResponse.body.name).toBe('E2E Test Resource');
      
      const updateResponse = await request(app)
        .patch(`/api/resources/${resourceId}`)
        .send({
          '@type': 'CreativeWork',
          'description': 'Updated E2E test resource'
        })
        .expect(200);
      
      expect(updateResponse.body.description).toBe('Updated E2E test resource');
      
      await request(app)
        .delete(`/api/resources/${resourceId}`)
        .expect(204);
      
      await request(app)
        .get(`/api/resources/${resourceId}`)
        .expect(404);
    });
  });
});
