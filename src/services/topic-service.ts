/**
 * Topic Service
 * 
 * This service provides methods for managing topics.
 * It handles the business logic for topic operations.
 */

import { NodeFileSystem } from '../utils/file-system';
import { SchemaValidatorAdapter } from '../utils/schema-validator-adapter';
import { TopicManager } from '../managers/topic-manager';
import { Topic } from '../models/types';

/**
 * Topic service
 */
export class TopicService {
  private topicManager: TopicManager;

  /**
   * Create a new topic service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    const validator = SchemaValidatorAdapter.createWithSingleton();
    this.topicManager = new TopicManager(fileSystem, validator);
  }

  /**
   * Get all topics
   * 
   * @param page - Page number
   * @param limit - Number of items per page
   * @returns Paginated list of topics
   */
  public async getAllTopics(
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const items = await this.topicManager.list();
    
    const paginatedItems = items.slice(skip, skip + limit);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'UOR Topics',
      'description': 'List of UOR topic items',
      'numberOfItems': items.length,
      'itemListElement': paginatedItems.map((item, index) => ({
        '@type': 'ListItem',
        'position': skip + index + 1,
        'item': item
      }))
    };
  }

  /**
   * Get topic by ID
   * 
   * @param id - Topic ID
   * @returns Topic item or null if not found
   */
  public async getTopicById(id: string): Promise<Topic | null> {
    return this.topicManager.read(id);
  }

  /**
   * Create new topic
   * 
   * @param topicData - Topic data
   * @returns Created topic item
   */
  public async createTopic(topicData: Topic): Promise<Topic> {
    return this.topicManager.create(topicData);
  }

  /**
   * Update topic by ID
   * 
   * @param id - Topic ID
   * @param topicData - Partial topic data
   * @returns Updated topic item or null if not found
   */
  public async updateTopic(
    id: string,
    topicData: Partial<Topic>
  ): Promise<Topic | null> {
    const partialTopic = {
      ...topicData,
      '@type': 'CreativeWork'
    } as import('../models/types').PartialTopic;
    
    return this.topicManager.update(id, partialTopic);
  }

  /**
   * Delete topic by ID
   * 
   * @param id - Topic ID
   * @returns True if topic was deleted, false if not found
   */
  public async deleteTopic(id: string): Promise<boolean> {
    return this.topicManager.delete(id);
  }
}
