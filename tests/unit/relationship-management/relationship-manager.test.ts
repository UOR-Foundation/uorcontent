/**
 * Relationship Manager Tests
 * 
 * This file contains tests for the Relationship Manager.
 */

import { 
  RelationshipManager, 
  RelationshipType, 
  Relationship, 
  Graph as RelationshipGraph,
  ValidationResult
} from '../../../src/relationship-management/relationship-manager';
import { PredicateManager } from '../../../src/managers/predicate-manager';
import { ConceptManager } from '../../../src/managers/concept-manager';
import { ResourceManager } from '../../../src/managers/resource-manager';
import { TopicManager } from '../../../src/managers/topic-manager';
import { UORContentItem, Predicate } from '../../../src/models/types';

jest.mock('../../../src/managers/predicate-manager');
jest.mock('../../../src/managers/concept-manager');
jest.mock('../../../src/managers/resource-manager');
jest.mock('../../../src/managers/topic-manager');

describe('RelationshipManager', () => {
  let relationshipManager: RelationshipManager;
  let mockPredicateManager: jest.Mocked<PredicateManager>;
  let mockConceptManager: jest.Mocked<ConceptManager>;
  let mockResourceManager: jest.Mocked<ResourceManager>;
  let mockTopicManager: jest.Mocked<TopicManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPredicateManager = new PredicateManager(null as any, null as any) as jest.Mocked<PredicateManager>;
    mockConceptManager = new ConceptManager(null as any, null as any) as jest.Mocked<ConceptManager>;
    mockResourceManager = new ResourceManager(null as any, null as any) as jest.Mocked<ResourceManager>;
    mockTopicManager = new TopicManager(null as any, null as any) as jest.Mocked<TopicManager>;
    
    mockTopicManager.list = jest.fn().mockResolvedValue([]);
    
    mockPredicateManager.read = jest.fn().mockResolvedValue({
      '@context': 'https://schema.org',
      '@type': 'PropertyValue',
      '@id': 'UOR-P-001-test-predicate',
      'name': 'Test Predicate',
      'value': 'test-value',
      'subjectOf': { '@id': 'UOR-C-001-test-concept' },
      'targetCollection': ['UOR-R-001-test-resource']
    });
    
    mockPredicateManager.create = jest.fn().mockImplementation(async (predicate) => {
      return {
        ...predicate,
        '@id': 'UOR-P-001-test-predicate'
      };
    });
    
    mockPredicateManager.update = jest.fn().mockImplementation(async (id, updates) => {
      return {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': id,
        'name': updates.name || 'Test Predicate',
        'value': updates.value || 'test-value',
        'subjectOf': { '@id': 'UOR-C-001-test-concept' },
        'targetCollection': ['UOR-R-001-test-resource']
      };
    });
    
    mockPredicateManager.delete = jest.fn().mockResolvedValue(true);
    
    mockPredicateManager.list = jest.fn().mockResolvedValue([
      {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        '@id': 'UOR-P-001-test-predicate',
        'name': 'Test Predicate',
        'value': 'test-value',
        'subjectOf': { '@id': 'UOR-C-001-test-concept' },
        'targetCollection': ['UOR-R-001-test-resource']
      }
    ]);
    
    const mockConcept = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      '@id': 'UOR-C-001-test-concept',
      'name': 'Test Concept',
      'description': 'A test concept'
    };
    
    const mockResource = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'UOR-R-001-test-resource',
      'name': 'Test Resource',
      'description': 'A test resource'
    };
    
    mockConceptManager.read = jest.fn().mockImplementation(async (id) => {
      if (id === 'UOR-C-001-test-concept') {
        return mockConcept;
      }
      return null;
    });
    
    mockResourceManager.read = jest.fn().mockImplementation(async (id) => {
      if (id === 'UOR-R-001-test-resource') {
        return mockResource;
      }
      return null;
    });
    
    relationshipManager = new RelationshipManager(
      mockPredicateManager,
      mockConceptManager,
      mockResourceManager,
      mockTopicManager
    );
  });

  describe('createRelationship', () => {
    it('should create a relationship with valid data', async () => {
      const sourceId = 'UOR-C-001-test-concept';
      const targetId = 'UOR-R-001-test-resource';
      const predicateData: Omit<Predicate, '@id'> = {
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        name: 'Test Predicate',
        value: 'test-value',
        propertyID: 'test-property',
        subjectOf: { '@id': sourceId },
        targetCollection: [targetId]
      };
      
      const result = await relationshipManager.createRelationship(
        sourceId,
        targetId,
        predicateData
      );
      
      expect(mockConceptManager.read).toHaveBeenCalledWith(sourceId);
      expect(mockResourceManager.read).toHaveBeenCalledWith(targetId);
      expect(mockPredicateManager.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        type: RelationshipType.CONCEPT_TO_RESOURCE,
        sourceId,
        targetId,
        predicateId: expect.any(String)
      }));
    });
    
    it('should throw an error if source content item does not exist', async () => {
      const sourceId = 'UOR-C-999-nonexistent';
      const targetId = 'UOR-R-001-test-resource';
      const predicateId = 'UOR-P-001-test-predicate';
      
      mockConceptManager.read = jest.fn().mockResolvedValue(null);
      
      await expect(relationshipManager.createRelationship(
        sourceId,
        targetId,
        predicateId
      )).rejects.toThrow(`Source content item ${sourceId} not found`);
    });
  });
  
  describe('getRelationship', () => {
    it('should get a relationship by ID', async () => {
      const relationshipId = 'UOR-P-001-test-predicate';
      
      const result = await relationshipManager.getRelationship(relationshipId);
      
      expect(mockPredicateManager.read).toHaveBeenCalledWith(relationshipId);
      expect(result).toEqual(expect.objectContaining({
        id: relationshipId,
        sourceId: 'UOR-C-001-test-concept',
        targetId: 'UOR-R-001-test-resource',
        predicateId: relationshipId
      }));
    });
    
    it('should return null if relationship does not exist', async () => {
      const relationshipId = 'UOR-P-999-nonexistent';
      
      mockPredicateManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await relationshipManager.getRelationship(relationshipId);
      
      expect(mockPredicateManager.read).toHaveBeenCalledWith(relationshipId);
      expect(result).toBeNull();
    });
  });
  
  describe('updateRelationship', () => {
    it('should update a relationship with valid data', async () => {
      const relationshipId = 'UOR-P-001-test-predicate';
      
      const updates = {
        'name': 'Updated Relationship',
        'value': 'updated-value'
      };
      
      const result = await relationshipManager.updateRelationship(relationshipId, updates);
      
      expect(mockPredicateManager.read).toHaveBeenCalledWith(relationshipId);
      expect(mockPredicateManager.update).toHaveBeenCalledWith(relationshipId, expect.objectContaining({
        '@type': 'PropertyValue',
        ...updates
      }));
      expect(result).toEqual(expect.objectContaining({
        id: relationshipId,
        sourceId: 'UOR-C-001-test-concept',
        targetId: 'UOR-R-001-test-resource',
        predicateId: relationshipId
      }));
    });
    
    it('should return null if relationship does not exist', async () => {
      const relationshipId = 'UOR-P-999-nonexistent';
      const updates = {
        'name': 'Updated Relationship',
        'value': 'updated-value'
      };
      
      mockPredicateManager.read = jest.fn().mockResolvedValue(null);
      
      const result = await relationshipManager.updateRelationship(relationshipId, updates);
      
      expect(mockPredicateManager.read).toHaveBeenCalledWith(relationshipId);
      expect(result).toBeNull();
    });
    
    it('should throw an error if predicate update fails', async () => {
      const relationshipId = 'UOR-P-001-test-predicate';
      
      const updates = {
        'name': 'Updated Relationship',
        'value': 'updated-value'
      };
      
      mockPredicateManager.update = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      await expect(relationshipManager.updateRelationship(relationshipId, updates))
        .rejects.toThrow('Update failed');
      
      expect(mockPredicateManager.read).toHaveBeenCalledWith(relationshipId);
      expect(mockPredicateManager.update).toHaveBeenCalled();
    });
  });
  
  describe('deleteRelationship', () => {
    it('should delete a relationship by ID', async () => {
      const relationshipId = 'UOR-P-001-test-predicate';
      
      const result = await relationshipManager.deleteRelationship(relationshipId);
      
      expect(mockPredicateManager.delete).toHaveBeenCalledWith(relationshipId);
      expect(result).toBe(true);
    });
    
    it('should return false if relationship does not exist', async () => {
      const relationshipId = 'UOR-P-999-nonexistent';
      
      mockPredicateManager.delete = jest.fn().mockResolvedValue(false);
      
      const result = await relationshipManager.deleteRelationship(relationshipId);
      
      expect(mockPredicateManager.delete).toHaveBeenCalledWith(relationshipId);
      expect(result).toBe(false);
    });
  });
  
  describe('listRelationships', () => {
    it('should list all relationships', async () => {
      const mockConcept1 = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': 'UOR-C-001-concept-1',
        'name': 'Concept 1',
        'description': 'A test concept'
      };
      
      const mockResource1 = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-R-001-resource-1',
        'name': 'Resource 1',
        'description': 'A test resource'
      };
      
      const mockPredicates = [
        {
          '@context': 'https://schema.org',
          '@type': 'PropertyValue',
          '@id': 'UOR-P-001-predicate-1',
          'name': 'Predicate 1',
          'value': 'value-1',
          'subjectOf': { '@id': 'UOR-C-001-concept-1' },
          'targetCollection': ['UOR-R-001-resource-1']
        }
      ];
      
      mockPredicateManager.list = jest.fn().mockResolvedValue(mockPredicates);
      
      mockConceptManager.read = jest.fn().mockImplementation(async (id) => {
        if (id === 'UOR-C-001-concept-1') {
          return mockConcept1;
        }
        return null;
      });
      
      mockResourceManager.read = jest.fn().mockImplementation(async (id) => {
        if (id === 'UOR-R-001-resource-1') {
          return mockResource1;
        }
        return null;
      });
      
      const result = await relationshipManager.listRelationships();
      
      expect(mockPredicateManager.list).toHaveBeenCalled();
      expect(mockConceptManager.read).toHaveBeenCalled();
      expect(mockResourceManager.read).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        type: RelationshipType.CONCEPT_TO_RESOURCE,
        sourceId: 'UOR-C-001-concept-1',
        targetId: 'UOR-R-001-resource-1',
        predicateId: 'UOR-P-001-predicate-1'
      }));
    });
    
    it('should return an empty array if no relationships exist', async () => {
      mockPredicateManager.list = jest.fn().mockResolvedValue([]);
      
      const result = await relationshipManager.listRelationships();
      
      expect(mockPredicateManager.list).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
  
  describe('buildGraph', () => {
    it('should build a relationship graph from all relationships', async () => {
      const mockRelationships = [
        {
          id: 'UOR-P-001-predicate-1',
          type: RelationshipType.CONCEPT_TO_RESOURCE,
          sourceId: 'UOR-C-001-concept-1',
          targetId: 'UOR-R-001-resource-1',
          predicateId: 'UOR-P-001-predicate-1',
          properties: {
            name: 'Relationship 1'
          }
        }
      ];
      
      const mockConcept1 = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        '@id': 'UOR-C-001-concept-1',
        'name': 'Concept 1',
        'description': 'A test concept'
      };
      
      const mockResource1 = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': 'UOR-R-001-resource-1',
        'name': 'Resource 1',
        'description': 'A test resource'
      };
      
      relationshipManager.listRelationships = jest.fn().mockResolvedValue(mockRelationships);
      
      mockConceptManager.read = jest.fn().mockImplementation(async (id) => {
        if (id === 'UOR-C-001-concept-1') {
          return mockConcept1;
        }
        return null;
      });
      
      mockResourceManager.read = jest.fn().mockImplementation(async (id) => {
        if (id === 'UOR-R-001-resource-1') {
          return mockResource1;
        }
        return null;
      });
      
      const result = await relationshipManager.buildGraph();
      
      expect(relationshipManager.listRelationships).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        nodes: expect.any(Array),
        edges: expect.any(Array)
      }));
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThan(0);
    });
  });
  
  describe('findPaths', () => {
    it('should find paths between source and target nodes', async () => {
      const mockGraph: RelationshipGraph = {
        nodes: [
          { id: 'UOR-C-001-concept-1', type: 'DefinedTerm', name: 'Concept 1', properties: {} },
          { id: 'UOR-R-001-resource-1', type: 'CreativeWork', name: 'Resource 1', properties: {} },
          { id: 'UOR-C-002-concept-2', type: 'DefinedTerm', name: 'Concept 2', properties: {} },
          { id: 'UOR-R-002-resource-2', type: 'CreativeWork', name: 'Resource 2', properties: {} }
        ],
        edges: [
          { 
            id: 'UOR-P-001-predicate-1',
            source: 'UOR-C-001-concept-1', 
            target: 'UOR-R-001-resource-1', 
            label: 'Relationship 1',
            properties: {}
          },
          { 
            id: 'UOR-P-002-predicate-2',
            source: 'UOR-R-001-resource-1', 
            target: 'UOR-C-002-concept-2', 
            label: 'Relationship 2',
            properties: {}
          },
          { 
            id: 'UOR-P-003-predicate-3',
            source: 'UOR-C-002-concept-2', 
            target: 'UOR-R-002-resource-2', 
            label: 'Relationship 3',
            properties: {}
          }
        ]
      };
      
      relationshipManager.buildGraph = jest.fn().mockResolvedValue(mockGraph);
      
      const sourceId = 'UOR-C-001-concept-1';
      const targetId = 'UOR-R-002-resource-2';
      
      const result = await relationshipManager.findPaths(sourceId, targetId);
      
      expect(relationshipManager.buildGraph).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].nodes[0].id).toBe(sourceId);
      expect(result[0].nodes[result[0].nodes.length - 1].id).toBe(targetId);
    });
    
    it('should return an empty array if no paths exist', async () => {
      const mockGraph: RelationshipGraph = {
        nodes: [
          { id: 'UOR-C-001-concept-1', type: 'DefinedTerm', name: 'Concept 1', properties: {} },
          { id: 'UOR-R-001-resource-1', type: 'CreativeWork', name: 'Resource 1', properties: {} },
          { id: 'UOR-C-002-concept-2', type: 'DefinedTerm', name: 'Concept 2', properties: {} },
          { id: 'UOR-R-002-resource-2', type: 'CreativeWork', name: 'Resource 2', properties: {} }
        ],
        edges: [
          { 
            id: 'UOR-P-001-predicate-1',
            source: 'UOR-C-001-concept-1', 
            target: 'UOR-R-001-resource-1', 
            label: 'Relationship 1',
            properties: {}
          },
          { 
            id: 'UOR-P-003-predicate-3',
            source: 'UOR-C-002-concept-2', 
            target: 'UOR-R-002-resource-2', 
            label: 'Relationship 3',
            properties: {}
          }
        ]
      };
      
      relationshipManager.buildGraph = jest.fn().mockResolvedValue(mockGraph);
      
      const sourceId = 'UOR-C-001-concept-1';
      const targetId = 'UOR-R-002-resource-2';
      
      const result = await relationshipManager.findPaths(sourceId, targetId);
      
      expect(relationshipManager.buildGraph).toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });
  
  describe('validateGraph', () => {
    it('should validate a graph and return no errors for a valid graph', async () => {
      const mockPredicates = [
        {
          '@context': 'https://schema.org',
          '@type': 'PropertyValue',
          '@id': 'UOR-P-001-predicate-1',
          'name': 'Predicate 1',
          'value': 'value-1',
          'subjectOf': { '@id': 'UOR-C-001-concept-1' },
          'targetCollection': ['UOR-R-001-resource-1']
        }
      ];
      
      const mockGraph: RelationshipGraph = {
        nodes: [
          { id: 'UOR-C-001-concept-1', type: 'DefinedTerm', name: 'Concept 1', properties: {} },
          { id: 'UOR-R-001-resource-1', type: 'CreativeWork', name: 'Resource 1', properties: {} }
        ],
        edges: [
          { 
            id: 'UOR-P-001-predicate-1',
            source: 'UOR-C-001-concept-1', 
            target: 'UOR-R-001-resource-1', 
            label: 'Relationship 1',
            properties: {}
          }
        ]
      };
      
      relationshipManager.buildGraph = jest.fn().mockResolvedValue(mockGraph);
      
      const result = await relationshipManager.validateGraph();
      
      expect(relationshipManager.buildGraph).toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect circular references in a graph', async () => {
      const mockGraph: RelationshipGraph = {
        nodes: [
          { id: 'UOR-C-001-concept-1', type: 'DefinedTerm', name: 'Concept 1', properties: {} },
          { id: 'UOR-R-001-resource-1', type: 'CreativeWork', name: 'Resource 1', properties: {} },
          { id: 'UOR-C-002-concept-2', type: 'DefinedTerm', name: 'Concept 2', properties: {} }
        ],
        edges: [
          { 
            id: 'UOR-P-001-predicate-1',
            source: 'UOR-C-001-concept-1', 
            target: 'UOR-R-001-resource-1', 
            label: 'Relationship 1',
            properties: {}
          },
          { 
            id: 'UOR-P-002-predicate-2',
            source: 'UOR-R-001-resource-1', 
            target: 'UOR-C-002-concept-2', 
            label: 'Relationship 2',
            properties: {}
          },
          { 
            id: 'UOR-P-003-predicate-3',
            source: 'UOR-C-002-concept-2', 
            target: 'UOR-C-001-concept-1', 
            label: 'Relationship 3',
            properties: {}
          }
        ]
      };
      
      relationshipManager.buildGraph = jest.fn().mockResolvedValue(mockGraph);
      
      const result = await relationshipManager.validateGraph();
      
      expect(relationshipManager.buildGraph).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Circular reference detected');
    });
  });
  
  describe('exportGraph', () => {
    it('should export a graph in the specified format', async () => {
      const mockGraph: RelationshipGraph = {
        nodes: [
          { id: 'UOR-C-001-concept-1', type: 'DefinedTerm', name: 'Concept 1', properties: {} },
          { id: 'UOR-R-001-resource-1', type: 'CreativeWork', name: 'Resource 1', properties: {} }
        ],
        edges: [
          { 
            id: 'UOR-P-001-predicate-1',
            source: 'UOR-C-001-concept-1', 
            target: 'UOR-R-001-resource-1', 
            label: 'Relationship 1',
            properties: {}
          }
        ]
      };
      
      relationshipManager.buildGraph = jest.fn().mockResolvedValue(mockGraph);
      
      const result = await relationshipManager.exportGraph({
        sourceId: 'UOR-C-001-concept-1'
      });
      
      expect(relationshipManager.buildGraph).toHaveBeenCalled();
      expect(result).toContain('"nodes":');
      expect(result).toContain('"edges":');
    });
  });
});
