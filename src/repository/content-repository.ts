import { ConceptManager } from '../managers/concept-manager';
import { ResourceManager } from '../managers/resource-manager';
import { TopicManager } from '../managers/topic-manager';
import { PredicateManager } from '../managers/predicate-manager';
import { RelationshipManager, RelationshipType } from '../relationship-management/relationship-manager';
import { EventEmitter } from '../utils/events';
import { 
  UORContentItem,
  Concept,
  Resource,
  Topic,
  Predicate
} from '../models/types';
import { 
  ContentType, 
  ContentIdentifier, 
  RepositoryStatistics, 
  HealthStatus,
  TransactionOptions
} from '../types.js';

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
  private transactionChanges: Map<string, UORContentItem[]> = new Map();

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
  private getManagerForType(contentType: ContentType): unknown {
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
  public async createContent(contentType: ContentType, content: UORContentItem): Promise<UORContentItem> {
    const manager = this.getManagerForType(contentType);
    let result: UORContentItem = {} as UORContentItem; // Initialize with empty object

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('create')) {
        this.transactionChanges.set('create', []);
      }
      const contentWithType = { ...content };
      this.transactionChanges.get('create')?.push(contentWithType);
      result = contentWithType;
    } else {
      if (contentType === 'relationship') {
        const relationshipContent = content as unknown as {
          sourceId: string;
          predicateId: string;
          targetId: string;
        };
        
        const relationship = await (manager as RelationshipManager).createRelationship(
          relationshipContent.sourceId,
          relationshipContent.targetId,
          relationshipContent.predicateId
        );
        
        result = {
          '@context': 'https://schema.org',
          '@type': 'Relationship',
          '@id': relationship.id,
          'name': `Relationship ${relationship.id}`,
          'sourceId': relationship.sourceId,
          'predicateId': relationship.predicateId,
          'targetId': relationship.targetId
        } as unknown as UORContentItem;
      } else if (contentType === 'concept') {
        result = await (manager as ConceptManager).create(content as Concept);
      } else if (contentType === 'resource') {
        result = await (manager as ResourceManager).create(content as Resource);
      } else if (contentType === 'topic') {
        result = await (manager as TopicManager).create(content as Topic);
      } else if (contentType === 'predicate') {
        result = await (manager as PredicateManager).create(content as Predicate);
      }

      this.eventEmitter.emit('content.created', { '@type': contentType, content: result });
    }

    return result as UORContentItem;
  }

  /**
   * Reads a content item by ID
   * @param contentType Content type
   * @param id Content item ID
   * @returns Content item or null if not found
   * @throws Error if content type is not supported
   */
  public async readContent(contentType: ContentType, id: ContentIdentifier): Promise<UORContentItem | null> {
    const manager = this.getManagerForType(contentType);
    let result: UORContentItem | null;

    if (contentType === 'relationship') {
      const relationship = await (manager as RelationshipManager).getRelationship(id);
      if (relationship) {
        result = {
          '@context': 'https://schema.org',
          '@type': 'Relationship',
          '@id': relationship.id,
          'name': `Relationship ${relationship.id}`,
          'sourceId': relationship.sourceId,
          'predicateId': relationship.predicateId,
          'targetId': relationship.targetId
        } as unknown as UORContentItem;
      } else {
        result = null;
      }
    } else if (contentType === 'concept') {
      result = await (manager as ConceptManager).read(id);
    } else if (contentType === 'resource') {
      result = await (manager as ResourceManager).read(id);
    } else if (contentType === 'topic') {
      result = await (manager as TopicManager).read(id);
    } else if (contentType === 'predicate') {
      result = await (manager as PredicateManager).read(id);
    } else {
      result = null;
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
    content: UORContentItem
  ): Promise<UORContentItem> {
    const manager = this.getManagerForType(contentType);
    let result: UORContentItem;

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('update')) {
        this.transactionChanges.set('update', []);
      }
      const contentWithType = { ...content };
      this.transactionChanges.get('update')?.push({ 
        '@id': id,
        ...contentWithType,
        '@type': contentType // Ensure @type is set correctly
      } as unknown as UORContentItem);
      result = contentWithType;
    } else {
      if (contentType === 'relationship') {
        const relationshipContent = content as unknown as Partial<Omit<Predicate, '@id' | '@type' | 'subjectOf' | 'targetCollection'>>;
        const relationship = await (manager as RelationshipManager).updateRelationship(
          id,
          relationshipContent
        );
        
        if (relationship) {
          result = {
            '@context': 'https://schema.org',
            '@type': 'Relationship',
            '@id': relationship.id,
            'name': `Relationship ${relationship.id}`,
            'sourceId': relationship.sourceId,
            'predicateId': relationship.predicateId,
            'targetId': relationship.targetId
          } as unknown as UORContentItem;
        } else {
          result = null as unknown as UORContentItem;
        }
      } else if (contentType === 'concept') {
        const conceptContent = content as unknown as Concept;
        const updatedConcept = await (manager as ConceptManager).update(id, conceptContent);
        result = updatedConcept as UORContentItem;
      } else if (contentType === 'resource') {
        const resourceContent = content as unknown as Resource;
        const updatedResource = await (manager as ResourceManager).update(id, resourceContent);
        result = updatedResource as UORContentItem;
      } else if (contentType === 'topic') {
        const topicContent = content as unknown as Topic;
        const updatedTopic = await (manager as TopicManager).update(id, topicContent);
        result = updatedTopic as UORContentItem;
      } else if (contentType === 'predicate') {
        const predicateContent = content as unknown as Predicate;
        const updatedPredicate = await (manager as PredicateManager).update(id, predicateContent);
        result = updatedPredicate as UORContentItem;
      } else {
        result = null as unknown as UORContentItem;
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
    let result = false;

    if (this.transactionInProgress) {
      if (!this.transactionChanges.has('delete')) {
        this.transactionChanges.set('delete', []);
      }
      this.transactionChanges.get('delete')?.push({ 
        '@type': contentType, 
        '@id': id 
      } as unknown as UORContentItem);
      result = true;
    } else {
      if (contentType === 'relationship') {
        result = await (manager as RelationshipManager).deleteRelationship(id);
      } else if (contentType === 'concept') {
        result = await (manager as ConceptManager).delete(id);
      } else if (contentType === 'resource') {
        result = await (manager as ResourceManager).delete(id);
      } else if (contentType === 'topic') {
        result = await (manager as TopicManager).delete(id);
      } else if (contentType === 'predicate') {
        result = await (manager as PredicateManager).delete(id);
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
    options: { limit?: number; offset?: number; filter?: Record<string, unknown> } = {}
  ): Promise<UORContentItem[]> {
    const manager = this.getManagerForType(contentType);
    let result: UORContentItem[] = [];

    if (contentType === 'relationship') {
      const relationshipFilter = options.filter ? {
        sourceId: options.filter.sourceId as string,
        targetId: options.filter.targetId as string,
        type: options.filter.type as RelationshipType
      } : undefined;
      
      const relationships = await (manager as RelationshipManager).listRelationships(relationshipFilter);
      result = relationships.map(relationship => ({
        '@context': 'https://schema.org',
        '@type': 'Relationship',
        '@id': relationship.id,
        'name': `Relationship ${relationship.id}`,
        'sourceId': relationship.sourceId,
        'predicateId': relationship.predicateId,
        'targetId': relationship.targetId
      } as unknown as UORContentItem));
    } else if (contentType === 'concept') {
      const conceptFilter = options.filter ? {
        name: options.filter.name as string,
        termCode: options.filter.termCode as string,
        inDefinedTermSet: options.filter.inDefinedTermSet as string,
        properties: options.filter.properties as Record<string, unknown>
      } : undefined;
      
      const concepts = await (manager as ConceptManager).list(conceptFilter);
      result = concepts as unknown as UORContentItem[];
    } else if (contentType === 'resource') {
      const resources = await (manager as ResourceManager).list(options.filter as any);
      result = resources as unknown as UORContentItem[];
    } else if (contentType === 'topic') {
      const topics = await (manager as TopicManager).list(options.filter as any);
      result = topics as unknown as UORContentItem[];
    } else if (contentType === 'predicate') {
      const predicates = await (manager as PredicateManager).list(options.filter as any);
      result = predicates as unknown as UORContentItem[];
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
          const contentType = item['@type'] as ContentType;
          let result;
          
          if (contentType === 'relationship') {
            const relationshipContent = item as unknown as {
              sourceId: string;
              targetId: string;
              predicateId: string;
            };
            
            result = await this.relationshipManager.createRelationship(
              relationshipContent.sourceId,
              relationshipContent.targetId,
              relationshipContent.predicateId
            );
          } else if (contentType === 'concept') {
            result = await (this.getManagerForType(contentType) as ConceptManager)
              .create(item as unknown as Concept);
          } else if (contentType === 'resource') {
            result = await (this.getManagerForType(contentType) as ResourceManager)
              .create(item as unknown as Resource);
          } else if (contentType === 'topic') {
            result = await (this.getManagerForType(contentType) as TopicManager)
              .create(item as unknown as Topic);
          } else if (contentType === 'predicate') {
            result = await (this.getManagerForType(contentType) as PredicateManager)
              .create(item as unknown as Predicate);
          }
          
          results.push({ operation: 'create', type: contentType, result });
          this.eventEmitter.emit('content.created', { type: contentType, content: result });
        }
      }

      if (this.transactionChanges.has('update')) {
        for (const item of this.transactionChanges.get('update') || []) {
          const contentType = item['@type'] as ContentType;
          const contentId = item['@id'] as string;
          let result;
          
          if (contentType === 'relationship') {
            const relationshipContent = item as unknown as {
              sourceId?: string;
              targetId?: string;
              predicateId?: string;
            };
            
            result = await this.relationshipManager.updateRelationship(
              contentId,
              relationshipContent as unknown as Partial<Omit<Predicate, "@id" | "@type" | "subjectOf" | "targetCollection">>
            );
          } else if (contentType === 'concept') {
            result = await (this.getManagerForType(contentType) as ConceptManager)
              .update(contentId, item as unknown as Concept);
          } else if (contentType === 'resource') {
            result = await (this.getManagerForType(contentType) as ResourceManager)
              .update(contentId, item as unknown as Resource);
          } else if (contentType === 'topic') {
            result = await (this.getManagerForType(contentType) as TopicManager)
              .update(contentId, item as unknown as Topic);
          } else if (contentType === 'predicate') {
            result = await (this.getManagerForType(contentType) as PredicateManager)
              .update(contentId, item as unknown as Predicate);
          }
          
          results.push({ operation: 'update', type: contentType, id: contentId, result });
          this.eventEmitter.emit('content.updated', { type: contentType, id: contentId, content: result });
        }
      }

      if (this.transactionChanges.has('delete')) {
        for (const item of this.transactionChanges.get('delete') || []) {
          const contentType = item['@type'] as ContentType;
          const contentId = item['@id'] as string;
          let result;
          
          if (contentType === 'relationship') {
            result = await this.relationshipManager.deleteRelationship(contentId);
          } else if (contentType === 'concept') {
            result = await (this.getManagerForType(contentType) as ConceptManager).delete(contentId);
          } else if (contentType === 'resource') {
            result = await (this.getManagerForType(contentType) as ResourceManager).delete(contentId);
          } else if (contentType === 'topic') {
            result = await (this.getManagerForType(contentType) as TopicManager).delete(contentId);
          } else if (contentType === 'predicate') {
            result = await (this.getManagerForType(contentType) as PredicateManager).delete(contentId);
          }
          
          results.push({ operation: 'delete', type: contentType, id: contentId, result });
          
          if (result) {
            this.eventEmitter.emit('content.deleted', { type: contentType, id: contentId });
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
      status: status as 'healthy' | 'degraded' | 'unhealthy',
      issues: issues.length > 0 ? issues : undefined,
      timestamp: new Date(),
      responseTime: Date.now() - startTime
    };

    this.eventEmitter.emit('health.checked', healthStatus);

    return healthStatus;
  }
}
