/**
 * API Endpoints End-to-End Tests
 * 
 * This file contains end-to-end tests for the API endpoints of the UOR Content Management Client.
 */

import request from 'supertest';
import { Server } from 'http';
import { setupTestEnvironment } from '../utils/test-helpers';
import { loadConceptFixture, loadResourceFixture } from '../utils/fixture-loader';
import { MCPServer } from '../../src/server';

describe('API Endpoints E2E Tests', () => {
  let server: Server;
  let testEnv: ReturnType<typeof setupTestEnvironment>;
  
  beforeAll(async () => {
    testEnv = setupTestEnvironment();
    
    process.env.CONTENT_DIR = testEnv.contentDir;
    
    const mcpServer = new MCPServer(0);
    
    const { MCPSchemaValidator } = require('../../src/server/utils/mcp-schema-validator');
    const { ContentSchemaValidator } = require('../../src/server/utils/content-schema-validator');
    
    await MCPSchemaValidator.getInstance().initialize();
    await ContentSchemaValidator.getInstance().initialize();
    
    server = mcpServer.getApp().listen(0);
  });
  
  afterAll(async () => {
    server.close();
    testEnv.cleanup();
  });
  
  describe('Concept API Endpoints', () => {
    it('should create a concept via API', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      
      const response = await request(server)
        .post('/api/concepts')
        .send(conceptFixture)
        .expect(201);
      
      expect(response.body).toHaveProperty('@id');
      expect(response.body.name).toBe(conceptFixture.name);
    });
    
    it('should retrieve a concept via API', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      
      const createResponse = await request(server)
        .post('/api/concepts')
        .send(conceptFixture)
        .expect(201);
      
      const conceptId = createResponse.body['@id'];
      
      const getResponse = await request(server)
        .get(`/api/concepts/${encodeURIComponent(conceptId)}`)
        .expect(200);
      
      expect(getResponse.body).toHaveProperty('@id', conceptId);
      expect(getResponse.body.name).toBe(conceptFixture.name);
    });
    
    it('should update a concept via API', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      
      const createResponse = await request(server)
        .post('/api/concepts')
        .send(conceptFixture)
        .expect(201);
      
      const conceptId = createResponse.body['@id'];
      
      const updateResponse = await request(server)
        .patch(`/api/concepts/${encodeURIComponent(conceptId)}`)
        .send({
          description: 'Updated description via API'
        })
        .expect(200);
      
      expect(updateResponse.body).toHaveProperty('description', 'Updated description via API');
    });
    
    it('should delete a concept via API', async () => {
      const conceptFixture = loadConceptFixture('valid-concept.json');
      
      const createResponse = await request(server)
        .post('/api/concepts')
        .send(conceptFixture)
        .expect(201);
      
      const conceptId = createResponse.body['@id'];
      
      await request(server)
        .delete(`/api/concepts/${encodeURIComponent(conceptId)}`)
        .expect(204);
      
      await request(server)
        .get(`/api/concepts/${encodeURIComponent(conceptId)}`)
        .expect(404);
    });
  });
  
  describe('Resource API Endpoints', () => {
    it('should create a resource via API', async () => {
      const resourceFixture = loadResourceFixture('valid-resource.json');
      
      const response = await request(server)
        .post('/api/resources')
        .send(resourceFixture)
        .expect(201);
      
      expect(response.body).toHaveProperty('@id');
      expect(response.body.name).toBe(resourceFixture.name);
    });
    
    it('should retrieve a resource via API', async () => {
      const resourceFixture = loadResourceFixture('valid-resource.json');
      
      const createResponse = await request(server)
        .post('/api/resources')
        .send(resourceFixture)
        .expect(201);
      
      const resourceId = createResponse.body['@id'];
      
      const getResponse = await request(server)
        .get(`/api/resources/${encodeURIComponent(resourceId)}`)
        .expect(200);
      
      expect(getResponse.body).toHaveProperty('@id', resourceId);
      expect(getResponse.body.name).toBe(resourceFixture.name);
    });
  });
  
  describe('Content Query API', () => {
    it('should query content by type', async () => {
      const concept1 = loadConceptFixture('valid-concept.json');
      const concept2 = {
        ...loadConceptFixture('valid-concept.json'),
        name: 'Second Test Concept',
        termCode: 'TEST-002'
      };
      
      await request(server)
        .post('/api/concepts')
        .send(concept1)
        .expect(201);
      
      await request(server)
        .post('/api/concepts')
        .send(concept2)
        .expect(201);
      
      const queryResponse = await request(server)
        .get('/api/content?type=concept')
        .expect(200);
      
      expect(Array.isArray(queryResponse.body)).toBe(true);
      expect(queryResponse.body.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should query content by name', async () => {
      const uniqueName = `Unique Test Concept ${Date.now()}`;
      const concept = {
        ...loadConceptFixture('valid-concept.json'),
        name: uniqueName
      };
      
      await request(server)
        .post('/api/concepts')
        .send(concept)
        .expect(201);
      
      const queryResponse = await request(server)
        .get(`/api/content?name=${encodeURIComponent(uniqueName)}`)
        .expect(200);
      
      expect(Array.isArray(queryResponse.body)).toBe(true);
      expect(queryResponse.body.length).toBe(1);
      expect(queryResponse.body[0].name).toBe(uniqueName);
    });
  });
});
