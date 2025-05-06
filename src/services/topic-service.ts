/**
 * Topic Service
 * 
 * This service provides methods for managing topics.
 * It handles the business logic for topic operations.
 */

import { FileSystem, NodeFileSystem } from '../utils/file-system';
import { ContentRepository } from '../core/content-repository';
import { Topic } from '../models/types';

/**
 * Topic service
 */
export class TopicService {
  private repository: ContentRepository;

  /**
   * Create a new topic service
   */
  constructor() {
    const fileSystem = new NodeFileSystem();
    this.repository = new ContentRepository(fileSystem);
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

    const items = await this.repository.getAllContent('topic');
    
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
    return this.repository.getContentById(id) as Promise<Topic | null>;
  }

  /**
   * Create new topic
   * 
   * @param topicData - Topic data
   * @returns Created topic item
   */
  public async createTopic(topicData: Topic): Promise<Topic> {
    return this.repository.createContent(topicData) as Promise<Topic>;
  }

  /**
   * Update topic by ID
   * 
   * @param id - Topic ID
   * @param topicData - Topic data
   * @returns Updated topic item or null if not found
   */
  public async updateTopic(
    id: string,
    topicData: Partial<Topic>
  ): Promise<Topic | null> {
    return this.repository.updateContent(id, topicData) as Promise<Topic | null>;
  }

  /**
   * Delete topic by ID
   * 
   * @param id - Topic ID
   * @returns True if topic was deleted, false if not found
   */
  public async deleteTopic(id: string): Promise<boolean> {
    return this.repository.deleteContent(id);
  }
}
