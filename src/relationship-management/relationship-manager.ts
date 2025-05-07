/**
 * Relationship Manager
 * 
 * Provides functionality for managing relationships between content items,
 * including graph building, validation, and traversal.
 * 
 * Implementation for Issue #11: Relationship Management with graph validation
 */

import { PredicateManager } from '../managers/predicate-manager';
import { ConceptManager } from '../managers/concept-manager';
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { 
  Predicate, 
  Topic, 
  UORContentItem, 
  PartialPredicate 
} from '../models/types';

/**
 * Relationship type enum
 */
export enum RelationshipType {
  CONCEPT_TO_CONCEPT = 'concept-to-concept',
  CONCEPT_TO_RESOURCE = 'concept-to-resource',
  CONCEPT_TO_TOPIC = 'concept-to-topic',
  RESOURCE_TO_RESOURCE = 'resource-to-resource',
  RESOURCE_TO_TOPIC = 'resource-to-topic',
  TOPIC_TO_TOPIC = 'topic-to-topic'
}

/**
 * Relationship interface
 */
export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  predicateId: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph node interface
 */
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph edge interface
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph interface
 */
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Path interface
 */
export interface Path {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Relationship Manager class
 * Implements relationship management with graph validation
 */
export class RelationshipManager {
  /**
   * Create a new RelationshipManager
   * 
   * @param predicateManager - Predicate manager instance
   * @param conceptManager - Concept manager instance
   * @param resourceManager - Resource manager instance
   * @param topicManager - Topic manager instance
   */
  constructor(
    private predicateManager: PredicateManager,
    private conceptManager: ConceptManager,
    private resourceManager: ResourceManager,
    private topicManager: TopicManager
  ) {}

  /**
   * Create a relationship between two content items
   * 
   * @param sourceId - Source content item ID
   * @param targetId - Target content item ID
   * @param predicateId - Predicate ID or predicate data
   * @returns Created relationship
   */
  async createRelationship(
    sourceId: string,
    targetId: string,
    predicateId: string | Omit<Predicate, '@id'>
  ): Promise<Relationship> {
    const source = await this.getContentItem(sourceId);
    if (!source) {
      throw new Error(`Source content item ${sourceId} not found`);
    }

    const target = await this.getContentItem(targetId);
    if (!target) {
      throw new Error(`Target content item ${targetId} not found`);
    }

    const type = this.determineRelationshipType(source, target);

    let predicate: Predicate;
    if (typeof predicateId === 'string') {
      const existingPredicate = await this.predicateManager.read(predicateId);
      if (!existingPredicate) {
        throw new Error(`Predicate ${predicateId} not found`);
      }
      
      const newPredicate: Predicate = {
        ...existingPredicate,
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        subjectOf: {
          '@id': this.getFullId(sourceId)
        },
        targetCollection: [this.getFullId(targetId)]
      };
      
      predicate = await this.predicateManager.create(newPredicate);
    } else {
      const newPredicate: Predicate = {
        ...predicateId,
        '@context': 'https://schema.org',
        '@type': 'PropertyValue',
        subjectOf: {
          '@id': this.getFullId(sourceId)
        },
        targetCollection: [this.getFullId(targetId)]
      };
      
      predicate = await this.predicateManager.create(newPredicate);
    }

    return {
      id: predicate['@id']?.split(':').pop() as string,
      type,
      sourceId,
      targetId,
      predicateId: predicate['@id']?.split(':').pop() as string,
      properties: {
        name: predicate.name,
        propertyID: predicate.propertyID,
        value: predicate.value
      }
    };
  }

  /**
   * Get a relationship by ID
   * 
   * @param id - Relationship ID (predicate ID)
   * @returns Relationship or null if not found
   */
  async getRelationship(id: string): Promise<Relationship | null> {
    const predicate = await this.predicateManager.read(id);
    if (!predicate) {
      return null;
    }

    const sourceId = predicate.subjectOf['@id'].split(':').pop() as string;
    const targetId = predicate.targetCollection[0].split(':').pop() as string;

    const source = await this.getContentItem(sourceId);
    const target = await this.getContentItem(targetId);

    if (!source || !target) {
      return null;
    }

    return {
      id,
      type: this.determineRelationshipType(source, target),
      sourceId,
      targetId,
      predicateId: id,
      properties: {
        name: predicate.name,
        propertyID: predicate.propertyID,
        value: predicate.value
      }
    };
  }

  /**
   * Update a relationship
   * 
   * @param id - Relationship ID (predicate ID)
   * @param updates - Relationship updates
   * @returns Updated relationship or null if not found
   */
  async updateRelationship(
    id: string,
    updates: Partial<Omit<Predicate, '@id' | '@type' | 'subjectOf' | 'targetCollection'>>
  ): Promise<Relationship | null> {
    const predicate = await this.predicateManager.read(id);
    if (!predicate) {
      return null;
    }

    const partialUpdates: PartialPredicate = {
      '@type': 'PropertyValue',
      ...updates
    };

    const updatedPredicate = await this.predicateManager.update(id, partialUpdates);
    if (!updatedPredicate) {
      return null;
    }

    const sourceId = updatedPredicate.subjectOf['@id'].split(':').pop() as string;
    const targetId = updatedPredicate.targetCollection[0].split(':').pop() as string;

    const source = await this.getContentItem(sourceId);
    const target = await this.getContentItem(targetId);

    if (!source || !target) {
      return null;
    }

    return {
      id,
      type: this.determineRelationshipType(source, target),
      sourceId,
      targetId,
      predicateId: id,
      properties: {
        name: updatedPredicate.name,
        propertyID: updatedPredicate.propertyID,
        value: updatedPredicate.value
      }
    };
  }

  /**
   * Delete a relationship
   * 
   * @param id - Relationship ID (predicate ID)
   * @returns True if deleted, false if not found
   */
  async deleteRelationship(id: string): Promise<boolean> {
    return await this.predicateManager.delete(id);
  }

  /**
   * List relationships
   * 
   * @param filter - Optional filter criteria
   * @returns Array of relationships
   */
  async listRelationships(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
  }): Promise<Relationship[]> {
    const predicates = await this.predicateManager.list();
    const relationships: Relationship[] = [];

    for (const predicate of predicates) {
      const sourceId = predicate.subjectOf['@id'].split(':').pop() as string;
      const targetId = predicate.targetCollection[0].split(':').pop() as string;

      const source = await this.getContentItem(sourceId);
      const target = await this.getContentItem(targetId);

      if (!source || !target) {
        continue;
      }

      const type = this.determineRelationshipType(source, target);
      const relationship: Relationship = {
        id: predicate['@id']?.split(':').pop() as string,
        type,
        sourceId,
        targetId,
        predicateId: predicate['@id']?.split(':').pop() as string,
        properties: {
          name: predicate.name,
          propertyID: predicate.propertyID,
          value: predicate.value
        }
      };

      if (filter) {
        if (filter.sourceId && sourceId !== filter.sourceId) {
          continue;
        }
        if (filter.targetId && targetId !== filter.targetId) {
          continue;
        }
        if (filter.type && type !== filter.type) {
          continue;
        }
      }

      relationships.push(relationship);
    }

    return relationships;
  }

  /**
   * Build a graph from relationships
   * 
   * @param filter - Optional filter criteria
   * @returns Graph object with nodes and edges
   */
  async buildGraph(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
    maxDepth?: number;
  }): Promise<Graph> {
    const relationships = await this.listRelationships({
      sourceId: filter?.sourceId,
      targetId: filter?.targetId,
      type: filter?.type
    });

    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    const maxDepth = filter?.maxDepth || 10;

    const addNodeAndRelationships = async (
      nodeId: string,
      depth: number
    ): Promise<void> => {
      if (depth > maxDepth) {
        return;
      }

      if (!nodes.has(nodeId)) {
        const contentItem = await this.getContentItem(nodeId);
        if (!contentItem) {
          return;
        }

        nodes.set(nodeId, {
          id: nodeId,
          type: contentItem['@type'],
          name: contentItem.name,
          properties: {
            description: contentItem.description
          }
        });

        const outgoingRelationships = await this.listRelationships({
          sourceId: nodeId
        });

        for (const relationship of outgoingRelationships) {
          const edgeId = relationship.id;
          
          if (!edges.has(edgeId)) {
            edges.set(edgeId, {
              id: edgeId,
              source: relationship.sourceId,
              target: relationship.targetId,
              label: relationship.properties?.name as string || 'relates to',
              properties: relationship.properties
            });
          }

          await addNodeAndRelationships(relationship.targetId, depth + 1);
        }

        const incomingRelationships = await this.listRelationships({
          targetId: nodeId
        });

        for (const relationship of incomingRelationships) {
          const edgeId = relationship.id;
          
          if (!edges.has(edgeId)) {
            edges.set(edgeId, {
              id: edgeId,
              source: relationship.sourceId,
              target: relationship.targetId,
              label: relationship.properties?.name as string || 'relates to',
              properties: relationship.properties
            });
          }

          await addNodeAndRelationships(relationship.sourceId, depth + 1);
        }
      }
    };

    if (filter?.sourceId) {
      await addNodeAndRelationships(filter.sourceId, 0);
    } else if (filter?.targetId) {
      await addNodeAndRelationships(filter.targetId, 0);
    } else {
      for (const relationship of relationships) {
        await addNodeAndRelationships(relationship.sourceId, 0);
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }

  /**
   * Find paths between two nodes
   * 
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   * @param maxDepth - Maximum path depth
   * @returns Array of paths
   */
  async findPaths(
    sourceId: string,
    targetId: string,
    maxDepth = 5
  ): Promise<Path[]> {
    const graph = await this.buildGraph({
      maxDepth
    });

    const paths: Path[] = [];
    const visited = new Set<string>();
    const currentPath: {
      nodes: GraphNode[];
      edges: GraphEdge[];
    } = {
      nodes: [],
      edges: []
    };

    const sourceNode = graph.nodes.find(node => node.id === sourceId);
    const targetNode = graph.nodes.find(node => node.id === targetId);

    if (!sourceNode || !targetNode) {
      return paths;
    }

    const findPathsDFS = (
      currentId: string,
      depth: number
    ): void => {
      if (depth > maxDepth) {
        return;
      }

      visited.add(currentId);
      const currentNode = graph.nodes.find(node => node.id === currentId);
      if (currentNode) {
        currentPath.nodes.push(currentNode);
      }

      if (currentId === targetId) {
        paths.push({
          nodes: [...currentPath.nodes],
          edges: [...currentPath.edges],
          length: currentPath.edges.length
        });
      } else {
        const outgoingEdges = graph.edges.filter(edge => edge.source === currentId);
        
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            currentPath.edges.push(edge);
            findPathsDFS(edge.target, depth + 1);
            currentPath.edges.pop();
          }
        }
      }

      visited.delete(currentId);
      currentPath.nodes.pop();
    };

    findPathsDFS(sourceId, 0);

    return paths;
  }

  /**
   * Validate graph for integrity
   * 
   * @returns Validation result
   */
  async validateGraph(): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const graph = await this.buildGraph();
    
    // Check for circular references in the graph
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const checkForCycles = (nodeId: string, path: string[] = []): boolean => {
      if (recursionStack.has(nodeId)) {
        errors.push(`Circular reference detected: ${path.join(' -> ')} -> ${nodeId}`);
        return true;
      }
      
      if (visited.has(nodeId)) {
        return false;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = graph.edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        const newPath = [...path, nodeId];
        if (checkForCycles(edge.target, newPath)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        checkForCycles(node.id);
      }
    }
    
    // Validate node existence and relationships
    const predicates = await this.predicateManager.list();

    for (const predicate of predicates) {
      const sourceId = predicate.subjectOf['@id'].split(':').pop() as string;
      const source = await this.getContentItem(sourceId);
      
      if (!source) {
        errors.push(`Predicate ${predicate['@id']} references non-existent source ${sourceId}`);
      }

      for (const targetRef of predicate.targetCollection) {
        const targetId = targetRef.split(':').pop() as string;
        const target = await this.getContentItem(targetId);
        
        if (!target) {
          errors.push(`Predicate ${predicate['@id']} references non-existent target ${targetId}`);
        }
      }
    }

    const topics = await this.topicManager.list();
    for (const topic of topics) {
      if (topic.isPartOf && topic.isPartOf.length > 0) {
        for (const parentRef of topic.isPartOf) {
          const parentId = parentRef.split(':').pop() as string;
          const topicId = topic['@id']?.split(':').pop() as string;
          
          if (topicId) {
            try {
              const parent = await this.topicManager.read(parentId);
              if (parent && parent.isPartOf && parent.isPartOf.length > 0) {
                const checkAncestors = async (topic: Topic, ancestorChain: string[] = []): Promise<boolean> => {
                  if (ancestorChain.includes(topic['@id'] || '')) {
                    return true; // Circular reference detected
                  }
                  
                  if (!topic.isPartOf || topic.isPartOf.length === 0) {
                    return false;
                  }
                  
                  for (const parentRef of topic.isPartOf) {
                    const parentId = parentRef.split(':').pop() as string;
                    const parentTopic = await this.topicManager.read(parentId);
                    
                    if (parentTopic) {
                      const newChain = [...ancestorChain, topic['@id'] || ''];
                      if (parentId === topicId || await checkAncestors(parentTopic, newChain)) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                };
                
                const isCircular = await checkAncestors(parent, []);
                if (isCircular) {
                  errors.push(`Circular reference detected: Topic ${topicId} is part of ${parentId} which creates a cycle`);
                }
              }
            } catch (error) {
              errors.push(`Error checking circular reference for topic ${topicId}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export graph to JSON format
   * 
   * @param filter - Optional filter criteria
   * @returns JSON string representation of the graph
   */
  async exportGraph(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
    maxDepth?: number;
  }): Promise<string> {
    const graph = await this.buildGraph(filter);
    return JSON.stringify(graph, null, 2);
  }

  /**
   * Get content item by ID
   * 
   * @param id - Content item ID
   * @returns Content item or null if not found
   */
  private async getContentItem(id: string): Promise<UORContentItem | null> {
    // Helper function to cast different content types to UORContentItem
    const castToContentItem = <T extends UORContentItem>(item: T | null): UORContentItem | null => {
      return item as UORContentItem | null;
    };

    if (id.startsWith('UOR-C-')) {
      return castToContentItem(await this.conceptManager.read(id));
    } else if (id.startsWith('UOR-R-')) {
      return castToContentItem(await this.resourceManager.read(id));
    } else if (id.startsWith('UOR-T-')) {
      return castToContentItem(await this.topicManager.read(id));
    } else if (id.startsWith('UOR-P-')) {
      return castToContentItem(await this.predicateManager.read(id));
    } else {
      const conceptItem = await this.conceptManager.read(id);
      if (conceptItem) return conceptItem;
      
      const resourceItem = await this.resourceManager.read(id);
      if (resourceItem) return castToContentItem(resourceItem);
      
      const topicItem = await this.topicManager.read(id);
      if (topicItem) return castToContentItem(topicItem);
      
      const predicateItem = await this.predicateManager.read(id);
      if (predicateItem) return castToContentItem(predicateItem);
    }
    
    return null;
  }

  /**
   * Determine relationship type based on content items
   * 
   * @param source - Source content item
   * @param target - Target content item
   * @returns Relationship type
   */
  private determineRelationshipType(
    source: UORContentItem,
    target: UORContentItem
  ): RelationshipType {
    if (source['@type'] === 'DefinedTerm') {
      if (target['@type'] === 'DefinedTerm') {
        return RelationshipType.CONCEPT_TO_CONCEPT;
      } else if (target['@type'] === 'CreativeWork' && 'hasPart' in target) {
        return RelationshipType.CONCEPT_TO_TOPIC;
      } else if (target['@type'] === 'CreativeWork') {
        return RelationshipType.CONCEPT_TO_RESOURCE;
      }
    } else if (source['@type'] === 'CreativeWork' && !('hasPart' in source)) {
      if (target['@type'] === 'CreativeWork' && 'hasPart' in target) {
        return RelationshipType.RESOURCE_TO_TOPIC;
      } else if (target['@type'] === 'CreativeWork') {
        return RelationshipType.RESOURCE_TO_RESOURCE;
      }
    } else if (source['@type'] === 'CreativeWork' && 'hasPart' in source) {
      if (target['@type'] === 'CreativeWork' && 'hasPart' in target) {
        return RelationshipType.TOPIC_TO_TOPIC;
      }
    }
    
    throw new Error(`Unsupported relationship type between ${source['@type']} and ${target['@type']}`);
  }

  /**
   * Get full ID with URN prefix
   * 
   * @param id - Content item ID
   * @returns Full ID with URN prefix
   */
  private getFullId(id: string): string {
    if (id.startsWith('urn:')) {
      return id;
    }
    
    if (id.startsWith('UOR-C-')) {
      return `urn:uor:concept:${id}`;
    } else if (id.startsWith('UOR-R-')) {
      return `urn:uor:resource:${id}`;
    } else if (id.startsWith('UOR-T-')) {
      return `urn:uor:topic:${id}`;
    } else if (id.startsWith('UOR-P-')) {
      return `urn:uor:predicate:${id}`;
    }
    
    return `urn:uor:${id}`;
  }
}
