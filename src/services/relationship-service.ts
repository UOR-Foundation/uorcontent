/**
 * Relationship Service
 * 
 * This service provides methods for managing relationships between content items.
 * It integrates the RelationshipManager with the MCP server.
 */

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidatorAdapter } from '../utils/schema-validator-adapter';
import { 
  RelationshipManager, 
  Relationship, 
  Graph, 
  Path, 
  ValidationResult, 
  RelationshipType 
} from '../relationship-management/relationship-manager';
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { PredicateManager } from '../managers/predicate-manager';
import { ConceptManager } from '../managers/concept-manager';
import { Predicate } from '../models/types';

/**
 * Relationship service
 */
export class RelationshipService {
  private relationshipManager: RelationshipManager;

  /**
   * Create a new relationship service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const validator = SchemaValidatorAdapter.createWithSingleton();
    
    const conceptManager = new ConceptManager(fileSystem, validator);
    const resourceManager = new ResourceManager(fileSystem, validator);
    const topicManager = new TopicManager(fileSystem, validator);
    const predicateManager = new PredicateManager(fileSystem, validator);
    
    this.relationshipManager = new RelationshipManager(
      predicateManager,
      conceptManager,
      resourceManager,
      topicManager
    );
  }

  /**
   * Create a new relationship
   * 
   * @param sourceId - Source content ID
   * @param targetId - Target content ID
   * @param predicateData - Predicate ID or predicate data
   * @returns Created relationship
   */
  public async createRelationship(
    sourceId: string,
    targetId: string,
    predicateData: string | Omit<Predicate, '@id'>
  ): Promise<Relationship> {
    return this.relationshipManager.createRelationship(
      sourceId,
      targetId,
      predicateData
    );
  }

  /**
   * Get relationship by ID
   * 
   * @param id - Relationship ID
   * @returns Relationship or null if not found
   */
  public async getRelationship(id: string): Promise<Relationship | null> {
    return this.relationshipManager.getRelationship(id);
  }

  /**
   * Update relationship
   * 
   * @param id - Relationship ID
   * @param properties - Updated properties
   * @returns Updated relationship or null if not found
   */
  public async updateRelationship(
    id: string,
    properties: Record<string, unknown>
  ): Promise<Relationship | null> {
    return this.relationshipManager.updateRelationship(id, properties);
  }

  /**
   * Delete relationship
   * 
   * @param id - Relationship ID
   * @returns True if deleted, false if not found
   */
  public async deleteRelationship(id: string): Promise<boolean> {
    return this.relationshipManager.deleteRelationship(id);
  }

  /**
   * List relationships
   * 
   * @param filter - Optional filter criteria
   * @returns Array of relationships
   */
  public async listRelationships(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
  }): Promise<Relationship[]> {
    return this.relationshipManager.listRelationships(filter);
  }

  /**
   * Build a graph from relationships
   * 
   * @param filter - Optional filter criteria
   * @returns Graph object with nodes and edges
   */
  public async buildGraph(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
    maxDepth?: number;
  }): Promise<Graph> {
    return this.relationshipManager.buildGraph(filter);
  }

  /**
   * Find paths between two nodes
   * 
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   * @param maxDepth - Maximum path depth
   * @returns Array of paths
   */
  public async findPaths(
    sourceId: string,
    targetId: string,
    maxDepth = 5
  ): Promise<Path[]> {
    return this.relationshipManager.findPaths(sourceId, targetId, maxDepth);
  }

  /**
   * Validate graph for integrity
   * 
   * @returns Validation result
   */
  public async validateGraph(): Promise<ValidationResult> {
    return this.relationshipManager.validateGraph();
  }

  /**
   * Export graph to JSON format
   * 
   * @param filter - Optional filter criteria
   * @returns JSON string representation of the graph
   */
  public async exportGraph(filter?: {
    sourceId?: string;
    targetId?: string;
    type?: RelationshipType;
    maxDepth?: number;
  }): Promise<string> {
    return this.relationshipManager.exportGraph(filter);
  }
}
