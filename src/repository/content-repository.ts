import { ConceptManager } from '../managers/concept-manager';
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { PredicateManager } from '../managers/predicate-manager';
import { RelationshipManager } from '../relationship-management/relationship-manager';
import { EventEmitter } from '../utils/events';
import { 
  ContentType, 
  ContentItem, 
  ContentIdentifier, 
  RepositoryStatistics, 
  HealthStatus,
  TransactionOptions
} from '../types';

/**
 * Content Repository API providing a unified interface for all content types
 * Implements Issue #12
 */
export class ContentRepository {
  private conceptManager: ConceptManager;
  private resourceManager: ResourceManager;
  private topicManager: TopicManager;
  private predicateManager: PredicateManager;
  private relationshipManager: RelationshipManager;
  private eventEmitter: EventEmitter;
  private transactionInProgress: boolean = false;
  private transactionChanges: Map<string, ContentItem[]> = new Map();

  /**
   * Creates a new ContentRepository instance
   * @param conceptManager Concept manager instance
   * @param resourceManager Resource manager instance
   * @param topicManager Topic manager instance
   * @param predicateManager Predicate manager instance
   * @param relationshipManager Relationship manager instance
   */
  constructor(
    conceptManager: ConceptManager,
    resourceManager: ResourceManager,
    topicManager: TopicManager,
    predicateManager: PredicateManager,
    relationshipManager: RelationshipManager
  ) {
    this.conceptManager = conceptManager;
    this.resourceManager = resourceManager;
    this.topicManager = topicManager;
    this.predicateManager = predicateManager;
    this.relationshipManager = relationshipManager;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Gets the appropriate manager for a content type
   * @param contentType Content type
   * @returns Manager for the content type
   * @throws Error if content type is not supported
   */
  private getManagerForType(contentType: ContentType): any {
    switch (contentType) {
      case 'concept':
        return this.conceptManager;
      case 'resource':
        return this.resourceManager;
      case 'topic':
        return this.topicManager;
      case 'predicate':
        return this.predicateManager;
      case 'relationship':
        return this.relationshipManager;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  /**
   * Creates a new content item
   * @param contentType Content type
   * @param content Content item data
   * @returns Created content item
   * @throws Error if content type is not supported or content is invalid
   */
  public async createContent(contentType: ContentType, content: ContentItem): Promise<ContentItem> {
    const manager = this.getManagerForType(contentType);
    let result: ContentItem;

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('create')) {
        this.transactionChanges.set('create', []);
      }
      this.transactionChanges.get('create')?.push({ type: contentType, ...content });
      result = content;
    } else {
      if (contentType === 'relationship') {
        result = await manager.createRelationship(
          content.subject,
          content.predicate,
          content.target,
          content.metadata
        );
      } else {
        result = await manager.create(content);
      }

      this.eventEmitter.emit('content.created', { type: contentType, content: result });
    }

    return result;
  }

  /**
   * Reads a content item by ID
   * @param contentType Content type
   * @param id Content item ID
   * @returns Content item or null if not found
   * @throws Error if content type is not supported
   */
  public async readContent(contentType: ContentType, id: ContentIdentifier): Promise<ContentItem | null> {
    const manager = this.getManagerForType(contentType);
    let result: ContentItem | null;

    if (contentType === 'relationship') {
      result = await manager.getRelationship(id);
    } else {
      result = await manager.get(id);
    }

    if (result) {
      this.eventEmitter.emit('content.read', { type: contentType, id });
    }

    return result;
  }

  /**
   * Updates a content item
   * @param contentType Content type
   * @param id Content item ID
   * @param content Updated content item data
   * @returns Updated content item
   * @throws Error if content type is not supported, content is invalid, or item not found
   */
  public async updateContent(
    contentType: ContentType, 
    id: ContentIdentifier, 
    content: ContentItem
  ): Promise<ContentItem> {
    const manager = this.getManagerForType(contentType);
    let result: ContentItem;

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('update')) {
        this.transactionChanges.set('update', []);
      }
      this.transactionChanges.get('update')?.push({ 
        type: contentType, 
        id, 
        ...content 
      });
      result = content;
    } else {
      if (contentType === 'relationship') {
        result = await manager.updateRelationship(
          id,
          content.subject,
          content.predicate,
          content.target,
          content.metadata
        );
      } else {
        result = await manager.update(id, content);
      }

      this.eventEmitter.emit('content.updated', { 
        type: contentType, 
        id, 
        content: result 
      });
    }

    return result;
  }

  /**
   * Deletes a content item
   * @param contentType Content type
   * @param id Content item ID
   * @returns True if deleted, false if not found
   * @throws Error if content type is not supported
   */
  public async deleteContent(contentType: ContentType, id: ContentIdentifier): Promise<boolean> {
    const manager = this.getManagerForType(contentType);
    let result: boolean;

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('delete')) {
        this.transactionChanges.set('delete', []);
      }
      this.transactionChanges.get('delete')?.push({ 
        type: contentType, 
        id 
      });
      result = true;
    } else {
      if (contentType === 'relationship') {
        result = await manager.deleteRelationship(id);
      } else {
        result = await manager.delete(id);
      }

      if (result) {
        this.eventEmitter.emit('content.deleted', { type: contentType, id });
      }
    }

    return result;
  }

  /**
   * Lists content items of a specific type
   * @param contentType Content type
   * @param options List options (pagination, filtering)
   * @returns List of content items
   * @throws Error if content type is not supported
   */
  public async listContent(
    contentType: ContentType, 
    options: { limit?: number; offset?: number; filter?: Record<string, any> } = {}
  ): Promise<ContentItem[]> {
    const manager = this.getManagerForType(contentType);
    let result: ContentItem[];

    if (contentType === 'relationship') {
      result = await manager.listRelationships(options);
    } else {
      result = await manager.list(options);
    }

    this.eventEmitter.emit('content.listed', { type: contentType, count: result.length });

    return result;
  }

  /**
   * Begins a transaction for atomic operations
   * @param options Transaction options
   * @throws Error if a transaction is already in progress
   */
  public beginTransaction(options: TransactionOptions = {}): void {
    if (this.transactionInProgress) {
      throw new Error('A transaction is already in progress');
    }

    this.transactionInProgress = true;
    this.transactionChanges.clear();
    
    this.eventEmitter.emit('transaction.begin', { options });
  }

  /**
   * Commits the current transaction
   * @returns Result of the transaction
   * @throws Error if no transaction is in progress
   */
  public async commitTransaction(): Promise<{ success: boolean; results: any[] }> {
    if (!this.transactionInProgress) {
      throw new Error('No transaction in progress');
    }

    const results: any[] = [];
    let success = true;

    try {
      if (this.transactionChanges.has('create')) {
        for (const item of this.transactionChanges.get('create') || []) {
          const { type, ...content } = item;
          let result;
          
          if (type === 'relationship') {
            result = await this.relationshipManager.createRelationship(
              content.sourceId,
              content.targetId,
              content.predicateId
            );
          } else {
            const manager = this.getManagerForType(type);
            result = await manager.create(content);
          }
          
          results.push({ operation: 'create', type, result });
          this.eventEmitter.emit('content.created', { type, content: result });
        }
      }

      if (this.transactionChanges.has('update')) {
        for (const item of this.transactionChanges.get('update') || []) {
          const { type, id, ...content } = item;
          let result;
          
          if (type === 'relationship') {
            result = await this.relationshipManager.updateRelationship(
              id,
              content
            );
          } else {
            const manager = this.getManagerForType(type);
            result = await manager.update(id, content);
          }
          
          results.push({ operation: 'update', type, id, result });
          this.eventEmitter.emit('content.updated', { type, id, content: result });
        }
      }

      if (this.transactionChanges.has('delete')) {
        for (const item of this.transactionChanges.get('delete') || []) {
          const { type, id } = item;
          let result;
          
          if (type === 'relationship') {
            result = await this.relationshipManager.deleteRelationship(id);
          } else {
            const manager = this.getManagerForType(type);
            result = await manager.delete(id);
          }
          
          results.push({ operation: 'delete', type, id, result });
          
          if (result) {
            this.eventEmitter.emit('content.deleted', { type, id });
          }
        }
      }

      this.eventEmitter.emit('transaction.commit', { success: true, count: results.length });
    } catch (error) {
      success = false;
      this.eventEmitter.emit('transaction.error', { error });
      throw error;
    } finally {
      this.transactionInProgress = false;
      this.transactionChanges.clear();
    }

    return { success, results };
  }

  /**
   * Rolls back the current transaction
   * @throws Error if no transaction is in progress
   */
  public rollbackTransaction(): void {
    if (!this.transactionInProgress) {
      throw new Error('No transaction in progress');
    }

    this.transactionInProgress = false;
    this.transactionChanges.clear();
    
    this.eventEmitter.emit('transaction.rollback');
  }

  /**
   * Registers an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Removes an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Gets repository statistics
   * @returns Repository statistics
   */
  public async getStatistics(): Promise<RepositoryStatistics> {
    const [
      concepts,
      resources,
      topics,
      predicates,
      relationships
    ] = await Promise.all([
      this.conceptManager.list(),
      this.resourceManager.list(),
      this.topicManager.list(),
      this.predicateManager.list(),
      this.relationshipManager.listRelationships()
    ]);
    
    const conceptCount = concepts.length;
    const resourceCount = resources.length;
    const topicCount = topics.length;
    const predicateCount = predicates.length;
    const relationshipCount = relationships.length;

    const statistics: RepositoryStatistics = {
      totalItems: conceptCount + resourceCount + topicCount + predicateCount + relationshipCount,
      itemsByType: {
        concept: conceptCount,
        resource: resourceCount,
        topic: topicCount,
        predicate: predicateCount,
        relationship: relationshipCount
      },
      lastUpdated: new Date()
    };

    this.eventEmitter.emit('statistics.generated', statistics);

    return statistics;
  }

  /**
   * Checks repository health
   * @returns Health status
   */
  public async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    let status = 'healthy';
    const issues: string[] = [];

    try {
      const managerChecks = [
        { name: 'conceptManager', manager: this.conceptManager },
        { name: 'resourceManager', manager: this.resourceManager },
        { name: 'topicManager', manager: this.topicManager },
        { name: 'predicateManager', manager: this.predicateManager },
        { name: 'relationshipManager', manager: this.relationshipManager }
      ];

      for (const { name, manager } of managerChecks) {
        if (!manager) {
          status = 'degraded';
          issues.push(`${name} is not available`);
        }
      }

      const indexChecks = [
        { name: 'concept', manager: this.conceptManager },
        { name: 'resource', manager: this.resourceManager },
        { name: 'topic', manager: this.topicManager },
        { name: 'predicate', manager: this.predicateManager }
      ];

      for (const { name, manager } of indexChecks) {
        try {
          const items = await manager.list();
          const ids = items.map((item: any) => item['@id'] || item.id);
          const uniqueIds = new Set(ids);
          const indexValid = ids.length === uniqueIds.size;
          
          if (!indexValid) {
            status = 'degraded';
            issues.push(`${name} index integrity check failed - duplicate IDs found`);
          }
        } catch (error) {
          status = 'degraded';
          issues.push(`${name} index check error: ${(error as Error).message}`);
        }
      }

      try {
        const relationshipsValid = await this.relationshipManager.validateGraph();
        if (!relationshipsValid) {
          status = 'degraded';
          issues.push('Relationship graph integrity check failed');
        }
      } catch (error) {
        status = 'degraded';
        issues.push(`Relationship check error: ${(error as Error).message}`);
      }
    } catch (error) {
      status = 'unhealthy';
      issues.push(`Health check error: ${(error as Error).message}`);
    }

    const healthStatus: HealthStatus = {
      status,
      issues: issues.length > 0 ? issues : undefined,
      timestamp: new Date(),
      responseTime: Date.now() - startTime
    };

    this.eventEmitter.emit('health.checked', healthStatus);

    return healthStatus;
  }
}
