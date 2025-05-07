/**
 * Topic Manager
 * 
 * Provides enhanced CRUD operations for Topic entities with validation,
 * ID generation, and hierarchy management.
 * 
 * Implementation for Issue #9: Topic Manager Implementation
 */

import { FileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { Topic, PartialTopic } from '../models/types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Filter options for listing topics
 */
export interface TopicFilter {
  name?: string;
  keywords?: string[];
  about?: string[];
  hasPart?: string[];
  isPartOf?: string[];
  educationalLevel?: string;
  learningResourceType?: string;
}

/**
 * Event types for topic operations
 */
export enum TopicEventType {
  CREATED = 'topic:created',
  UPDATED = 'topic:updated',
  DELETED = 'topic:deleted'
}

/**
 * Event payload for topic operations
 */
export interface TopicEvent {
  type: TopicEventType;
  topicId: string;
  topic: Topic;
}

/**
 * Event listener for topic operations
 */
export type TopicEventListener = (event: TopicEvent) => void;

/**
 * Topic Manager class
 * Implements CRUD operations for topics with validation and hierarchy management
 */
export class TopicManager {
  private eventListeners: Map<TopicEventType, TopicEventListener[]> = new Map();
  private contentDir: string;

  /**
   * Create a new TopicManager
   * 
   * @param fileSystem - File system implementation
   * @param validator - Schema validator implementation
   * @param contentDir - Content directory (default: 'converted')
   */
  constructor(
    private fileSystem: FileSystem,
    private validator: SchemaValidator,
    contentDir = 'converted'
  ) {
    this.contentDir = contentDir;
    
    Object.values(TopicEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  addEventListener(type: TopicEventType, listener: TopicEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  removeEventListener(type: TopicEventType, listener: TopicEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(type, listeners);
    }
  }

  /**
   * Emit event
   * 
   * @param type - Event type
   * @param topicId - Topic ID
   * @param topic - Topic data
   */
  private emitEvent(type: TopicEventType, topicId: string, topic: Topic): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: TopicEvent = { type, topicId, topic };
    
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in topic event listener for ${type}:`, error);
      }
    }
  }

  /**
   * Generate topic ID
   * 
   * @param name - Topic name
   * @returns Generated ID in UOR-T-XXX-name format
   */
  private generateId(name: string): string {
    const code = uuidv4().substring(0, 8).toUpperCase();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `UOR-T-${code}-${safeName}`;
  }

  /**
   * Get topic file path
   * 
   * @param id - Topic ID
   * @returns Absolute file path
   */
  private getTopicPath(id: string): string {
    return path.join(this.contentDir, 'topics', `${id}.json`);
  }

  /**
   * Create a new topic
   * 
   * @param topic - Topic data
   * @returns Created topic with ID
   * @throws Error if validation fails
   */
  async create(topic: Topic): Promise<Topic> {
    const validationResult = this.validator.validateTopic(topic);
    if (!validationResult.valid) {
      throw new Error(`Invalid topic: ${JSON.stringify(validationResult.errors)}`);
    }

    if (!topic['@id']) {
      const id = this.generateId(topic.name);
      topic['@id'] = `urn:uor:topic:${id}`;
    }

    const now = new Date().toISOString();
    topic.dateCreated = now;
    topic.dateModified = now;

    if (topic.isPartOf && topic.isPartOf.length > 0) {
      for (const parentId of topic.isPartOf) {
        const parent = await this.read(parentId.split(':').pop() as string);
        if (!parent) {
          throw new Error(`Parent topic ${parentId} not found`);
        }
      }
    }

    const filePath = this.getTopicPath(topic['@id'].split(':').pop() as string);
    await this.fileSystem.writeJsonFile(filePath, topic);

    this.emitEvent(
      TopicEventType.CREATED, 
      topic['@id'], 
      topic
    );

    return topic;
  }

  /**
   * Read a topic by ID
   * 
   * @param id - Topic ID
   * @returns Topic data or null if not found
   */
  async read(id: string): Promise<Topic | null> {
    try {
      const filePath = this.getTopicPath(id);
      return await this.fileSystem.readJsonFile<Topic>(filePath);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'FileNotFoundError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a topic
   * 
   * @param id - Topic ID
   * @param updates - Partial topic updates
   * @param version - Optional version for optimistic concurrency
   * @returns Updated topic or null if not found
   * @throws Error if validation fails or version mismatch
   */
  async update(id: string, updates: PartialTopic, version?: string): Promise<Topic | null> {
    const existing = await this.read(id);
    if (!existing) {
      return null;
    }

    if (version && existing.dateModified !== version) {
      throw new Error(`Topic ${id} was modified by another process`);
    }

    const validationResult = this.validator.validatePartial(updates, 'CreativeWork');
    if (!validationResult.valid) {
      throw new Error(`Invalid topic updates: ${JSON.stringify(validationResult.errors)}`);
    }

    if (updates.isPartOf && updates.isPartOf.length > 0) {
      for (const parentId of updates.isPartOf) {
        const parent = await this.read(parentId.split(':').pop() as string);
        if (!parent) {
          throw new Error(`Parent topic ${parentId} not found`);
        }
        
        if (await this.isCircularReference(id, parentId.split(':').pop() as string)) {
          throw new Error(`Circular reference detected: ${id} cannot be part of ${parentId}`);
        }
      }
    }

    const updated: Topic = { ...existing, ...updates };
    updated.dateModified = new Date().toISOString();

    const filePath = this.getTopicPath(id);
    await this.fileSystem.writeJsonFile(filePath, updated);

    this.emitEvent(
      TopicEventType.UPDATED, 
      updated['@id'] || '', 
      updated
    );

    return updated;
  }

  /**
   * Delete a topic
   * 
   * @param id - Topic ID
   * @returns True if deleted, false if not found
   * @throws Error if topic has children
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.read(id);
    if (!existing) {
      return false;
    }

    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new Error(`Cannot delete topic ${id} with children: ${children.map(c => c['@id']).join(', ')}`);
    }

    const filePath = this.getTopicPath(id);
    await this.fileSystem.deleteFile(filePath);

    this.emitEvent(
      TopicEventType.DELETED, 
      existing['@id'] || '', 
      existing
    );

    return true;
  }

  /**
   * List topics with optional filtering
   * 
   * @param filter - Optional filter criteria
   * @returns Array of topics matching filter
   */
  async list(filter?: TopicFilter): Promise<Topic[]> {
    const topicsDir = path.join(this.contentDir, 'topics');
    const files = await this.fileSystem.listDirectory(topicsDir);
    
    const topics: Topic[] = [];
    if (!files || !Array.isArray(files)) {
      return topics;
    }
    
    for (const file of files) {
      if (file.endsWith('.json') && file.startsWith('UOR-T-')) {
        try {
          const topic = await this.fileSystem.readJsonFile<Topic>(
            path.join(topicsDir, file)
          );
          topics.push(topic);
        } catch (error) {
          console.error(`Error reading topic file ${file}:`, error);
        }
      }
    }

    if (filter) {
      return topics.filter(topic => {
        if (filter.name && !topic.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }

        if (filter.educationalLevel && topic.educationalLevel !== filter.educationalLevel) {
          return false;
        }

        if (filter.learningResourceType && topic.learningResourceType !== filter.learningResourceType) {
          return false;
        }

        if (filter.keywords && filter.keywords.length > 0 && topic.keywords) {
          const hasAllKeywords = filter.keywords.every(keyword => 
            topic.keywords?.includes(keyword)
          );
          if (!hasAllKeywords) {
            return false;
          }
        }

        if (filter.about && filter.about.length > 0 && topic.about) {
          const hasAllAbout = filter.about.every(about => 
            topic.about?.includes(about)
          );
          if (!hasAllAbout) {
            return false;
          }
        }

        if (filter.hasPart && filter.hasPart.length > 0 && topic.hasPart) {
          const hasAllParts = filter.hasPart.every(part => 
            topic.hasPart?.includes(part)
          );
          if (!hasAllParts) {
            return false;
          }
        }

        if (filter.isPartOf && filter.isPartOf.length > 0 && topic.isPartOf) {
          const isPartOfAll = filter.isPartOf.every(parent => 
            topic.isPartOf?.includes(parent)
          );
          if (!isPartOfAll) {
            return false;
          }
        }

        return true;
      });
    }

    return topics;
  }

  /**
   * Batch create multiple topics
   * 
   * @param topics - Array of topics to create
   * @returns Array of created topics with IDs
   */
  async batchCreate(topics: Topic[]): Promise<Topic[]> {
    for (const topic of topics) {
      const validationResult = this.validator.validateTopic(topic);
      if (!validationResult.valid) {
        throw new Error(`Invalid topic: ${JSON.stringify(validationResult.errors)}`);
      }
    }

    const results: Topic[] = [];
    for (const topic of topics) {
      const created = await this.create(topic);
      results.push(created);
    }

    return results;
  }

  /**
   * Get children of a topic
   * 
   * @param id - Topic ID
   * @returns Array of child topics
   */
  async getChildren(id: string): Promise<Topic[]> {
    const fullId = id.startsWith('urn:') ? id : `urn:uor:topic:${id}`;
    const allTopics = await this.list();
    
    return allTopics.filter(topic => 
      topic.isPartOf && topic.isPartOf.includes(fullId)
    );
  }

  /**
   * Get parents of a topic
   * 
   * @param id - Topic ID
   * @returns Array of parent topics
   */
  async getParents(id: string): Promise<Topic[]> {
    const topic = await this.read(id);
    if (!topic || !topic.isPartOf || topic.isPartOf.length === 0) {
      return [];
    }
    
    const parents: Topic[] = [];
    for (const parentId of topic.isPartOf) {
      const parent = await this.read(parentId.split(':').pop() as string);
      if (parent) {
        parents.push(parent);
      }
    }
    
    return parents;
  }

  /**
   * Check if adding a parent would create a circular reference
   * 
   * @param topicId - Topic ID
   * @param parentId - Parent topic ID
   * @returns True if circular reference would be created
   */
  private async isCircularReference(topicId: string, parentId: string): Promise<boolean> {
    if (topicId === parentId) {
      return true;
    }
    
    const parent = await this.read(parentId);
    if (!parent || !parent.isPartOf || parent.isPartOf.length === 0) {
      return false;
    }
    
    for (const grandparentId of parent.isPartOf) {
      const gpId = grandparentId.split(':').pop() as string;
      if (gpId === topicId || await this.isCircularReference(topicId, gpId)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get topic hierarchy as a tree
   * 
   * @param rootId - Optional root topic ID (if not provided, returns forest)
   * @returns Topic hierarchy tree
   */
  async getHierarchy(rootId?: string): Promise<Record<string, unknown>[]> {
    const allTopics = await this.list();
    
    const topicMap = new Map<string, Topic>();
    for (const topic of allTopics) {
      const id = topic['@id']?.split(':').pop() as string;
      topicMap.set(id, topic);
    }
    
    const buildTree = (id: string): Record<string, unknown> => {
      const topic = topicMap.get(id);
      if (!topic) {
        return { id, name: 'Unknown Topic', children: [] };
      }
      
      const children: Record<string, unknown>[] = [];
      for (const childTopic of allTopics) {
        if (childTopic.isPartOf && childTopic.isPartOf.includes(topic['@id'] || '')) {
          const childId = childTopic['@id']?.split(':').pop() as string;
          children.push(buildTree(childId));
        }
      }
      
      return {
        id,
        name: topic.name,
        children
      };
    };
    
    if (rootId) {
      return [buildTree(rootId)];
    }
    
    const rootTopics = allTopics.filter(topic => 
      !topic.isPartOf || topic.isPartOf.length === 0
    );
    
    return rootTopics.map(topic => {
      const id = topic['@id']?.split(':').pop() as string;
      return buildTree(id);
    });
  }
}
