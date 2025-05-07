# Feature Role: Phase 3 Implementation Specifications

This document contains implementation specifications for Phase 3 components of the UOR Content Management Client, focusing on Resource, Topic, and Predicate Managers along with Relationship Management with graph validation.

## Implementation Overview

Phase 3 builds upon the foundation established in Phases 1 and 2, extending the content management capabilities with additional manager types and relationship management. The implementation follows these principles:

1. **Consistent Architecture**: Follow the same patterns established in Phase 2
2. **Dependency Injection**: Use dependency injection for all components
3. **Atomic Operations**: Ensure file system operations are atomic
4. **Optimistic Concurrency**: Implement version-based concurrency control
5. **Reference Integrity**: Enforce reference integrity between content items
6. **Schema Validation**: Validate all content against Schema.org types
7. **Index Integration**: Update indexes when content changes
8. **MCP Server Integration**: Expose functionality through JSON-RPC endpoints

## Resource Manager Implementation (Issue #8)

### Class Structure

```typescript
// File: src/managers/resource-manager.ts

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { IndexManager } from '../index-management/index-manager';
import { Resource, PartialResource, FilterOptions } from '../models/types';
import { generateId, generateVersion } from '../utils/id-generator';
import { ContentRepository } from '../core/content-repository';

/**
 * Resource Manager
 * 
 * Manages resources in the UOR Content Management Client.
 * Resources are represented as Schema.org CreativeWork types.
 */
export class ResourceManager {
  private readonly basePath: string = 'converted/resources';
  private readonly contentRepository: ContentRepository;
  
  constructor(
    private readonly fileSystem: NodeFileSystem,
    private readonly validator: SchemaValidator,
    private readonly indexManager: IndexManager
  ) {
    this.contentRepository = new ContentRepository(fileSystem);
  }
  
  // Public methods to implement:
  // - create(resource: Resource): Promise<Resource>
  // - read(id: string): Promise<Resource>
  // - update(id: string, updates: PartialResource, version?: string): Promise<Resource>
  // - delete(id: string): Promise<boolean>
  // - list(filter?: FilterOptions): Promise<Resource[]>
  // - batchCreate(resources: Resource[]): Promise<Resource[]>
  
  // Private methods to implement:
  // - generateId(name: string): string
  // - getFilePath(id: string): string
  // - checkReferences(id: string): Promise<Array<{ id: string; type: string }>>
}
```

### Implementation Details

1. **Create Operation**
   - Validate resource against Schema.org CreativeWork type
   - Generate ID with format "UOR-R-XXX-name" if not provided
   - Set metadata (dateCreated, dateModified, version)
   - Write to file system using atomic operations
   - Update index with new resource
   - Return created resource with ID

2. **Read Operation**
   - Get file path for resource ID
   - Read file from file system
   - Parse JSON content
   - Return resource or throw error if not found

3. **Update Operation**
   - Validate updates against Schema.org CreativeWork type
   - Read existing resource
   - Check version for optimistic concurrency
   - Apply updates and update metadata
   - Write to file system using atomic operations
   - Update index with updated resource
   - Return updated resource

4. **Delete Operation**
   - Check if resource exists
   - Check for references to the resource
   - Delete file from file system
   - Update index to remove resource
   - Return success status

5. **List Operation**
   - Read directory contents
   - Parse each file as a resource
   - Apply filter criteria if provided
   - Sort resources by name
   - Return filtered list

6. **Batch Create Operation**
   - Validate all resources first
   - Create each resource
   - Return array of created resources

### Integration with MCP Server

```typescript
// File: src/server/endpoints/resource-endpoints.ts

import { ResourceManager } from '../../managers/resource-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register resource endpoints with the MCP server
 */
export function registerResourceEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  resourceManager: ResourceManager,
  validator: SchemaValidator
): void {
  // Endpoints to implement:
  // - resource.create
  // - resource.read
  // - resource.update
  // - resource.delete
  // - resource.list
  // - resource.batchCreate
}
```

## Topic Manager Implementation (Issue #9)

### Class Structure

```typescript
// File: src/managers/topic-manager.ts

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { IndexManager } from '../index-management/index-manager';
import { Topic, PartialTopic, FilterOptions, TopicHierarchy } from '../models/types';
import { generateId, generateVersion } from '../utils/id-generator';
import { ContentRepository } from '../core/content-repository';

/**
 * Topic Manager
 * 
 * Manages topics in the UOR Content Management Client.
 * Topics are represented as Schema.org CreativeWork types.
 */
export class TopicManager {
  private readonly basePath: string = 'converted/topics';
  private readonly contentRepository: ContentRepository;
  
  constructor(
    private readonly fileSystem: NodeFileSystem,
    private readonly validator: SchemaValidator,
    private readonly indexManager: IndexManager
  ) {
    this.contentRepository = new ContentRepository(fileSystem);
  }
  
  // Public methods to implement:
  // - create(topic: Topic): Promise<Topic>
  // - read(id: string): Promise<Topic>
  // - update(id: string, updates: PartialTopic, version?: string): Promise<Topic>
  // - delete(id: string): Promise<boolean>
  // - list(filter?: FilterOptions): Promise<Topic[]>
  // - batchCreate(topics: Topic[]): Promise<Topic[]>
  // - getTopicHierarchy(id: string): Promise<TopicHierarchy>
  // - addToHierarchy(parentId: string, childId: string): Promise<{ parent: Topic; child: Topic }>
  // - removeFromHierarchy(parentId: string, childId: string): Promise<{ parent: Topic; child: Topic }>
  
  // Private methods to implement:
  // - generateId(name: string): string
  // - getFilePath(id: string): string
  // - checkReferences(id: string): Promise<Array<{ id: string; type: string }>>
  // - wouldCreateCircularReference(parent: Topic, child: Topic): boolean
}
```

### Implementation Details

1. **Create, Read, Update, Delete, List, and Batch Create Operations**
   - Similar to ResourceManager with appropriate type changes
   - Generate ID with format "UOR-T-XXX-name"
   - Validate against Schema.org CreativeWork type

2. **Topic Hierarchy Operations**
   - Get topic hierarchy by recursively fetching child topics
   - Add topic to hierarchy by updating parent and child references
   - Remove topic from hierarchy by updating parent and child references
   - Check for circular references to prevent invalid hierarchies

### Integration with MCP Server

```typescript
// File: src/server/endpoints/topic-endpoints.ts

import { TopicManager } from '../../managers/topic-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register topic endpoints with the MCP server
 */
export function registerTopicEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  topicManager: TopicManager,
  validator: SchemaValidator
): void {
  // Endpoints to implement:
  // - topic.create
  // - topic.read
  // - topic.update
  // - topic.delete
  // - topic.list
  // - topic.batchCreate
  // - topic.getHierarchy
  // - topic.addToHierarchy
  // - topic.removeFromHierarchy
}
```

## Predicate Manager Implementation (Issue #10)

### Class Structure

```typescript
// File: src/managers/predicate-manager.ts

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { IndexManager } from '../index-management/index-manager';
import { Predicate, PartialPredicate, FilterOptions } from '../models/types';
import { generateId, generateVersion } from '../utils/id-generator';
import { ContentRepository } from '../core/content-repository';

/**
 * Predicate Manager
 * 
 * Manages predicates in the UOR Content Management Client.
 * Predicates are represented as Schema.org PropertyValue types.
 */
export class PredicateManager {
  private readonly basePath: string = 'converted/predicates';
  
  constructor(
    private readonly fileSystem: NodeFileSystem,
    private readonly validator: SchemaValidator,
    private readonly indexManager: IndexManager,
    private readonly contentRepository: ContentRepository
  ) {}
  
  // Public methods to implement:
  // - create(predicate: Predicate): Promise<Predicate>
  // - read(id: string): Promise<Predicate>
  // - update(id: string, updates: PartialPredicate, version?: string): Promise<Predicate>
  // - delete(id: string): Promise<boolean>
  // - list(filter?: FilterOptions): Promise<Predicate[]>
  // - batchCreate(predicates: Predicate[]): Promise<Predicate[]>
  // - getPredicatesForContent(contentId: string): Promise<Predicate[]>
  // - getPredicatesTargetingContent(contentId: string): Promise<Predicate[]>
  
  // Private methods to implement:
  // - generateId(name: string): string
  // - getFilePath(id: string): string
}
```

### Implementation Details

1. **Create, Read, Update, Delete, List, and Batch Create Operations**
   - Similar to ResourceManager with appropriate type changes
   - Generate ID with format "UOR-P-XXX-name"
   - Validate against Schema.org PropertyValue type
   - Check if subject and target exist before creating or updating

2. **Relationship Operations**
   - Get predicates for a content item by filtering predicates with matching subject
   - Get predicates targeting a content item by filtering predicates with matching target

### Integration with MCP Server

```typescript
// File: src/server/endpoints/predicate-endpoints.ts

import { PredicateManager } from '../../managers/predicate-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register predicate endpoints with the MCP server
 */
export function registerPredicateEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  predicateManager: PredicateManager,
  validator: SchemaValidator
): void {
  // Endpoints to implement:
  // - predicate.create
  // - predicate.read
  // - predicate.update
  // - predicate.delete
  // - predicate.list
  // - predicate.batchCreate
  // - predicate.getForContent
  // - predicate.getTargetingContent
}
```

## Relationship Management Implementation (Issue #11)

### Class Structure

```typescript
// File: src/managers/relationship-manager.ts

import { PredicateManager } from './predicate-manager';
import { ContentRepository } from '../core/content-repository';
import { SchemaValidator } from '../utils/schema-validation';
import { Relationship, RelationshipGraph, ValidationResult, GraphNode, GraphEdge } from '../models/types';

/**
 * Relationship Manager
 * 
 * Manages relationships between content items in the UOR Content Management Client.
 * Provides graph validation and querying capabilities.
 */
export class RelationshipManager {
  constructor(
    private readonly predicateManager: PredicateManager,
    private readonly contentRepository: ContentRepository,
    private readonly validator: SchemaValidator
  ) {}
  
  // Public methods to implement:
  // - createRelationship(relationship: Relationship): Promise<Predicate>
  // - validateRelationship(relationship: Relationship): Promise<ValidationResult>
  // - queryRelationships(filter?: FilterOptions): Promise<Predicate[]>
  // - buildGraph(filter?: FilterOptions): Promise<RelationshipGraph>
  // - validateGraph(graph: RelationshipGraph): Promise<ValidationResult>
  // - visualizeGraph(graph: RelationshipGraph): Promise<string>
  // - findPath(sourceId: string, targetId: string): Promise<GraphEdge[]>
  
  // Private methods to implement:
  // - checkForCycles(graph: RelationshipGraph): string[]
  // - checkForOrphanedNodes(graph: RelationshipGraph): string[]
  // - checkForInvalidReferences(graph: RelationshipGraph): string[]
}
```

### Implementation Details

1. **Relationship Creation and Validation**
   - Create relationship by creating a predicate
   - Validate relationship by checking subject and target existence
   - Query relationships by filtering predicates

2. **Graph Operations**
   - Build relationship graph by collecting nodes (content items) and edges (predicates)
   - Validate graph for cycles, orphaned nodes, and invalid references
   - Visualize graph in a format suitable for rendering (e.g., DOT format for Graphviz)
   - Find path between content items using breadth-first search

### Integration with MCP Server

```typescript
// File: src/server/endpoints/relationship-endpoints.ts

import { RelationshipManager } from '../../managers/relationship-manager';
import { SchemaValidator } from '../../utils/schema-validation';

/**
 * Register relationship endpoints with the MCP server
 */
export function registerRelationshipEndpoints(
  server: {addMethod: (name: string, handler: (params: unknown) => Promise<unknown>) => void},
  relationshipManager: RelationshipManager,
  validator: SchemaValidator
): void {
  // Endpoints to implement:
  // - relationship.create
  // - relationship.validate
  // - relationship.query
  // - relationship.buildGraph
  // - relationship.validateGraph
  // - relationship.visualizeGraph
  // - relationship.findPath
}
```

## Type Definitions

```typescript
// File: src/models/types.ts

// Add these type definitions to the existing types.ts file

/**
 * Resource type
 * Extends UORContentItem with CreativeWork properties
 */
export interface Resource extends UORContentItem {
  '@type': 'Article' | 'CreativeWork' | 'WebContent' | 'MediaObject';
  // Additional resource-specific properties
}

/**
 * Partial Resource type for updates
 */
export type PartialResource = Partial<Resource>;

/**
 * Topic type
 * Extends UORContentItem with CreativeWork properties and hierarchy references
 */
export interface Topic extends UORContentItem {
  '@type': 'CreativeWork';
  isPartOf?: string; // Parent topic ID
  hasPart?: string[]; // Child topic IDs
  // Additional topic-specific properties
}

/**
 * Partial Topic type for updates
 */
export type PartialTopic = Partial<Topic>;

/**
 * Topic Hierarchy type
 */
export interface TopicHierarchy {
  topic: Topic;
  children: TopicHierarchy[];
}

/**
 * Predicate type
 * Extends UORContentItem with PropertyValue properties
 */
export interface Predicate extends UORContentItem {
  '@type': 'PropertyValue';
  subject: string; // Content item ID that owns this predicate
  target: string; // Content item ID that this predicate points to
  // Additional predicate-specific properties
}

/**
 * Partial Predicate type for updates
 */
export type PartialPredicate = Partial<Predicate>;

/**
 * Relationship type
 */
export interface Relationship {
  subject: string; // Content item ID that owns this relationship
  predicate: string; // Relationship type (e.g., "references", "isRelatedTo")
  target: string; // Content item ID that this relationship points to
}

/**
 * Relationship Graph types
 */
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Validation Result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

## Integration with Server

```typescript
// File: src/server/index.ts

// Add these imports
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { PredicateManager } from '../managers/predicate-manager';
import { RelationshipManager } from '../managers/relationship-manager';
import { registerResourceEndpoints } from './endpoints/resource-endpoints';
import { registerTopicEndpoints } from './endpoints/topic-endpoints';
import { registerPredicateEndpoints } from './endpoints/predicate-endpoints';
import { registerRelationshipEndpoints } from './endpoints/relationship-endpoints';

// Add this to the server initialization
const resourceManager = new ResourceManager(fileSystem, validator, indexManager);
const topicManager = new TopicManager(fileSystem, validator, indexManager);
const predicateManager = new PredicateManager(fileSystem, validator, indexManager, contentRepository);
const relationshipManager = new RelationshipManager(predicateManager, contentRepository, validator);

// Register endpoints
registerResourceEndpoints(server, resourceManager, validator);
registerTopicEndpoints(server, topicManager, validator);
registerPredicateEndpoints(server, predicateManager, validator);
registerRelationshipEndpoints(server, relationshipManager, validator);
```

## Technical Decisions

1. **Consistent Architecture**
   - All managers follow the same pattern as the ConceptManager from Phase 2
   - Dependency injection is used for all components
   - File system operations are atomic
   - Optimistic concurrency is implemented using version checking

2. **Reference Integrity**
   - Predicates check if subject and target exist before creation
   - Content items check for references before deletion
   - Relationship graph validation checks for invalid references

3. **Schema Validation**
   - Resources and Topics are validated against Schema.org CreativeWork type
   - Predicates are validated against Schema.org PropertyValue type
   - Relationships are validated for subject and target existence

4. **Index Integration**
   - All managers update indexes when content changes
   - Indexes are used for efficient querying and reference checking

5. **MCP Server Integration**
   - All functionality is exposed through JSON-RPC endpoints
   - Endpoints follow the same pattern as Phase 2 endpoints
   - Error handling is consistent across all endpoints

## Integration with Phase 1 and 2

1. **File System Utilities (Phase 1)**
   - All managers use the NodeFileSystem from Phase 1
   - Atomic write operations are used for all file system operations

2. **Schema Validation (Phase 1)**
   - All content is validated against Schema.org types
   - Partial updates are validated before application

3. **Content Repository (Phase 2)**
   - Used for checking content existence and retrieving content
   - Integrated with all managers for reference integrity

4. **Index Management (Phase 2)**
   - All managers update indexes when content changes
   - Indexes are used for efficient querying and reference checking

5. **Query Operations (Phase 2)**
   - Relationship queries build on the query operations from Phase 2
   - Graph operations provide advanced querying capabilities
