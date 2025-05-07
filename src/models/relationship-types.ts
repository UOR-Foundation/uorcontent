/**
 * Relationship Types
 * 
 * This file defines the types used for relationship management.
 */

/**
 * Relationship interface
 */
export interface Relationship {
  '@context': string;
  '@type': 'Relationship';
  '@id': string;
  'name': string;
  'description'?: string;
  'sourceId': string;
  'targetId': string;
  'predicateId': string;
  'weight'?: number;
  'bidirectional'?: boolean;
  'metadata'?: Record<string, unknown>;
}

/**
 * Relationship graph node interface
 */
export interface RelationshipGraphNode {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
}

/**
 * Relationship graph edge interface
 */
export interface RelationshipGraphEdge {
  source: string;
  target: string;
  predicate: string;
  name: string;
  properties?: Record<string, unknown>;
}

/**
 * Relationship graph interface
 */
export interface RelationshipGraph {
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
}

/**
 * Relationship path interface
 */
export interface RelationshipPath {
  nodes: string[];
  edges: RelationshipGraphEdge[];
  length: number;
}

/**
 * Relationship validation result interface
 */
export interface RelationshipValidationResult {
  valid: boolean;
  errors: string[];
}
