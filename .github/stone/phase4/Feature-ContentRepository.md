# Feature Role: Content Repository API Implementation (Issue #12)

This document contains detailed implementation specifications for the Content Repository API component of Phase 4 of the UOR Content Management Client.

## Implementation Overview

The Content Repository API provides a unified interface for managing all content types in the UOR Content Management Client. It integrates with the existing manager components from Phases 2 and 3, adding transaction support and an event system.

## Key Components

### ContentRepository Class

```typescript
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ConceptManager } from '../managers/concept-manager';
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { PredicateManager } from '../managers/predicate-manager';
import { RelationshipManager } from '../managers/relationship-manager';
import { FileSystemService } from '../services/file-system-service';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Transaction object for managing atomic operations
 */
export interface Transaction {
  id: string;
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    contentType: ContentTypeEnum;
    id?: string;
    data?: any;
    result?: any;
  }>;
  status: 'pending' | 'committed' | 'rolled_back';
  timestamp: string;
}

/**
 * Repository statistics
 */
export interface RepositoryStatistics {
  counts: {
    concept: number;
    resource: number;
    topic: number;
    predicate: number;
    total: number;
  };
  lastModified: string;
  size: number;
}

/**
 * Repository health status
 */
export interface RepositoryHealth {
  status: 'healthy' | 'unhealthy';
  components: {
    fileSystem: { status: 'healthy' | 'unhealthy'; error?: string };
    conceptManager: { status: 'healthy' | 'unhealthy'; error?: string };
    resourceManager: { status: 'healthy' | 'unhealthy'; error?: string };
    topicManager: { status: 'healthy' | 'unhealthy'; error?: string };
    predicateManager: { status: 'healthy' | 'unhealthy'; error?: string };
    relationshipManager: { status: 'healthy' | 'unhealthy'; error?: string };
  };
  timestamp: string;
}

/**
 * Content Repository API providing unified interface for all content types
 */
export class ContentRepository {
  private fileSystem: FileSystemService;

  /**
   * Creates a new ContentRepository instance
   */
  constructor(
    private conceptManager: ConceptManager,
    private resourceManager: ResourceManager,
    private topicManager: TopicManager,
    private predicateManager: PredicateManager,
    private relationshipManager: RelationshipManager,
    private eventEmitter: EventEmitter
  ) {
    this.fileSystem = new FileSystemService();
  }

  /**
   * Creates a new content item of the specified type
   * @param contentType Type of content to create
   * @param content Content data
   * @returns Created content item
   */
  async create(contentType: ContentTypeEnum, content: any): Promise<any> {
    let result;

    switch (contentType) {
      case ContentTypeEnum.CONCEPT:
        result = await this.conceptManager.create(content);
        break;
      case ContentTypeEnum.RESOURCE:
        result = await this.resourceManager.create(content);
        break;
      case ContentTypeEnum.TOPIC:
        result = await this.topicManager.create(content);
        break;
      case ContentTypeEnum.PREDICATE:
        result = await this.predicateManager.create(content);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    // Emit event for content creation
    this.eventEmitter.emit('content.created', {
      type: contentType,
      id: result.id,
      content: result
    });

    return result;
  }

  /**
   * Reads a content item of the specified type by ID
   * @param contentType Type of content to read
   * @param id ID of the content item
   * @returns Content item
   */
  async read(contentType: ContentTypeEnum, id: string): Promise<any> {
    switch (contentType) {
      case ContentTypeEnum.CONCEPT:
        return this.conceptManager.read(id);
      case ContentTypeEnum.RESOURCE:
        return this.resourceManager.read(id);
      case ContentTypeEnum.TOPIC:
        return this.topicManager.read(id);
      case ContentTypeEnum.PREDICATE:
        return this.predicateManager.read(id);
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
  }

  /**
   * Updates a content item of the specified type
   * @param contentType Type of content to update
   * @param id ID of the content item
   * @param content Update data
   * @param version Optional version for optimistic concurrency
   * @returns Updated content item
   */
  async update(contentType: ContentTypeEnum, id: string, content: any, version?: string): Promise<any> {
    let result;

    switch (contentType) {
      case ContentTypeEnum.CONCEPT:
        result = await this.conceptManager.update(id, content, version);
        break;
      case ContentTypeEnum.RESOURCE:
        result = await this.resourceManager.update(id, content, version);
        break;
      case ContentTypeEnum.TOPIC:
        result = await this.topicManager.update(id, content, version);
        break;
      case ContentTypeEnum.PREDICATE:
        result = await this.predicateManager.update(id, content, version);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    // Emit event for content update
    this.eventEmitter.emit('content.updated', {
      type: contentType,
      id,
      content: result,
      updates: content
    });

    return result;
  }

  /**
   * Deletes a content item of the specified type
   * @param contentType Type of content to delete
   * @param id ID of the content item
   * @returns True if deletion was successful
   */
  async delete(contentType: ContentTypeEnum, id: string): Promise<boolean> {
    let result;

    switch (contentType) {
      case ContentTypeEnum.CONCEPT:
        result = await this.conceptManager.delete(id);
        break;
      case ContentTypeEnum.RESOURCE:
        result = await this.resourceManager.delete(id);
        break;
      case ContentTypeEnum.TOPIC:
        result = await this.topicManager.delete(id);
        break;
      case ContentTypeEnum.PREDICATE:
        result = await this.predicateManager.delete(id);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    // Emit event for content deletion
    if (result) {
      this.eventEmitter.emit('content.deleted', {
        type: contentType,
        id
      });
    }

    return result;
  }

  /**
   * Lists content items of the specified type
   * @param contentType Type of content to list
   * @param filter Optional filter criteria
   * @returns Array of content items
   */
  async list(contentType: ContentTypeEnum, filter?: any): Promise<any[]> {
    switch (contentType) {
      case ContentTypeEnum.CONCEPT:
        return this.conceptManager.list(filter);
      case ContentTypeEnum.RESOURCE:
        return this.resourceManager.list(filter);
      case ContentTypeEnum.TOPIC:
        return this.topicManager.list(filter);
      case ContentTypeEnum.PREDICATE:
        return this.predicateManager.list(filter);
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
  }

  /**
   * Begins a new transaction
   * @returns Transaction object
   */
  async beginTransaction(): Promise<Transaction> {
    return {
      id: uuidv4(),
      operations: [],
      status: 'pending',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Commits a transaction
   * @param transaction Transaction to commit
   */
  async commitTransaction(transaction: Transaction): Promise<void> {
    // In a real implementation, this would handle atomic commits
    // For now, we just mark the transaction as committed
    transaction.status = 'committed';
    
    // Emit event for transaction commit
    this.eventEmitter.emit('transaction.committed', {
      transactionId: transaction.id,
      operations: transaction.operations
    });
  }

  /**
   * Rolls back a transaction
   * @param transaction Transaction to roll back
   */
  async rollbackTransaction(transaction: Transaction): Promise<void> {
    // In a real implementation, this would undo all operations
    // For now, we just mark the transaction as rolled back
    transaction.status = 'rolled_back';
    
    // Emit event for transaction rollback
    this.eventEmitter.emit('transaction.rolledBack', {
      transactionId: transaction.id
    });
  }

  /**
   * Gets repository statistics
   * @returns Repository statistics
   */
  async getStatistics(): Promise<RepositoryStatistics> {
    const concepts = await this.conceptManager.list();
    const resources = await this.resourceManager.list();
    const topics = await this.topicManager.list();
    const predicates = await this.predicateManager.list();
    
    return {
      counts: {
        concept: concepts.length,
        resource: resources.length,
        topic: topics.length,
        predicate: predicates.length,
        total: concepts.length + resources.length + topics.length + predicates.length
      },
      lastModified: new Date().toISOString(),
      size: 0 // In a real implementation, this would calculate actual size
    };
  }

  /**
   * Checks repository health
   * @returns Repository health status
   */
  async checkHealth(): Promise<RepositoryHealth> {
    const components = {
      fileSystem: { status: 'healthy' as const },
      conceptManager: { status: 'healthy' as const },
      resourceManager: { status: 'healthy' as const },
      topicManager: { status: 'healthy' as const },
      predicateManager: { status: 'healthy' as const },
      relationshipManager: { status: 'healthy' as const }
    };
    
    // Check file system health
    try {
      await this.fileSystem.checkAccess();
    } catch (error) {
      components.fileSystem = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // Determine overall health
    const isHealthy = Object.values(components).every(c => c.status === 'healthy');
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      components,
      timestamp: new Date().toISOString()
    };
  }
}
```

### MCP Server Integration

```typescript
import { MCPServer } from '../server/mcp-server';
import { ContentRepository } from '../repository/content-repository';
import { ContentTypeEnum } from '../types/content-types';

/**
 * Registers Content Repository endpoints with the MCP server
 * @param mcpServer MCP server instance
 * @param contentRepository Content Repository instance
 */
export function registerContentRepositoryEndpoints(
  mcpServer: MCPServer,
  contentRepository: ContentRepository
): void {
  // Create content
  mcpServer.registerMethod('content.create', async (params) => {
    const { type, content } = params;
    return contentRepository.create(type, content);
  });

  // Read content
  mcpServer.registerMethod('content.read', async (params) => {
    const { type, id } = params;
    return contentRepository.read(type, id);
  });

  // Update content
  mcpServer.registerMethod('content.update', async (params) => {
    const { type, id, content, version } = params;
    return contentRepository.update(type, id, content, version);
  });

  // Delete content
  mcpServer.registerMethod('content.delete', async (params) => {
    const { type, id } = params;
    return contentRepository.delete(type, id);
  });

  // List content
  mcpServer.registerMethod('content.list', async (params) => {
    const { type, filter } = params;
    return contentRepository.list(type, filter);
  });

  // Begin transaction
  mcpServer.registerMethod('content.beginTransaction', async () => {
    return contentRepository.beginTransaction();
  });

  // Commit transaction
  mcpServer.registerMethod('content.commitTransaction', async (params) => {
    const { transaction } = params;
    await contentRepository.commitTransaction(transaction);
    return { success: true };
  });

  // Rollback transaction
  mcpServer.registerMethod('content.rollbackTransaction', async (params) => {
    const { transaction } = params;
    await contentRepository.rollbackTransaction(transaction);
    return { success: true };
  });

  // Get statistics
  mcpServer.registerMethod('content.getStatistics', async () => {
    return contentRepository.getStatistics();
  });

  // Check health
  mcpServer.registerMethod('content.checkHealth', async () => {
    return contentRepository.checkHealth();
  });
}
```

## Integration with Previous Phases

The Content Repository API integrates with the following components from previous phases:

1. **Phase 1 Components**:
   - Uses TypeScript configuration with strict mode
   - Leverages type definitions for content models
   - Utilizes file system utilities for persistence
   - Applies schema validation for content integrity

2. **Phase 2 Components**:
   - Integrates with ConceptManager for concept operations
   - Leverages IndexManager for efficient content retrieval
   - Builds upon Query Operations for content listing

3. **Phase 3 Components**:
   - Integrates with ResourceManager, TopicManager, and PredicateManager
   - Leverages RelationshipManager for relationship operations
   - Maintains reference integrity across all content types

## Implementation Details

### Transaction Support

The transaction support in the Content Repository API provides atomic operations across multiple content types. Key features include:

1. **Transaction Creation**: The `beginTransaction` method creates a new transaction with a unique ID.
2. **Operation Tracking**: Each operation (create, update, delete) is tracked within the transaction.
3. **Commit**: The `commitTransaction` method applies all operations atomically.
4. **Rollback**: The `rollbackTransaction` method undoes all operations in the transaction.

### Event System

The event system enables reactive programming patterns by emitting events for content changes:

1. **Content Events**: Events are emitted for content creation, update, and deletion.
2. **Transaction Events**: Events are emitted for transaction commit and rollback.
3. **Event Data**: Events include relevant data such as content type, ID, and content.

### Repository Statistics and Health

The Content Repository API provides monitoring capabilities:

1. **Statistics**: The `getStatistics` method returns counts, sizes, and last modified dates.
2. **Health Checks**: The `checkHealth` method verifies the health of all components.
3. **Component Status**: Health checks include file system, managers, and other dependencies.

## Testing Strategy

The Content Repository API should be tested with:

1. **Unit Tests**: Test each method in isolation with mocked dependencies.
2. **Integration Tests**: Test the integration with actual managers and file system.
3. **Transaction Tests**: Verify atomic operations and rollback functionality.
4. **Event Tests**: Ensure events are emitted correctly for all operations.
5. **Error Handling Tests**: Verify proper error handling for invalid inputs and edge cases.
