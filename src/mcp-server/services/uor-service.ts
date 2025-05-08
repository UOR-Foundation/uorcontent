/**
 * UOR Service
 * 
 * Service for interacting with the UOR API
 */

import axios from 'axios';
type AxiosInstance = ReturnType<typeof axios.create>;
import { UORConcept, UORPredicate, UORTopic, UORResource } from '../../models/uor-types';
import { logger } from '../utils/logger';

interface ListResponse<T> {
  itemListElement?: Array<{item: T}>;
}

/**
 * UOR Service
 * 
 * Service for interacting with the UOR API
 */
export class UORService {
  private axiosInstance: AxiosInstance;

  /**
   * Create a new UOR service
   * 
   * @param baseUrl - Base URL for the UOR API
   */
  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get all concepts
   * 
   * @returns All concepts
   */
  async getConcepts(): Promise<UORConcept[]> {
    try {
      const response = await this.axiosInstance.get<ListResponse<UORConcept>>('/concepts');
      return response.data?.itemListElement?.map(item => item.item) || [];
    } catch (error) {
      logger.error('Error getting concepts:', error);
      throw new Error('Failed to get concepts');
    }
  }

  /**
   * Get a concept by ID
   * 
   * @param id - Concept ID
   * @returns Concept data
   */
  async getConceptById(id: string): Promise<UORConcept> {
    try {
      const response = await this.axiosInstance.get<UORConcept>(`/concepts/${id}`);
      return response.data as UORConcept;
    } catch (error) {
      logger.error('Error getting concept:', error);
      throw new Error(`Failed to get concept with ID ${id}`);
    }
  }

  /**
   * Get all predicates
   * 
   * @returns All predicates
   */
  async getPredicates(): Promise<UORPredicate[]> {
    try {
      const response = await this.axiosInstance.get<ListResponse<UORPredicate>>('/predicates');
      return response.data?.itemListElement?.map(item => item.item) || [];
    } catch (error) {
      logger.error('Error getting predicates:', error);
      throw new Error('Failed to get predicates');
    }
  }

  /**
   * Get a predicate by ID
   * 
   * @param id - Predicate ID
   * @returns Predicate data
   */
  async getPredicateById(id: string): Promise<UORPredicate> {
    try {
      const response = await this.axiosInstance.get<UORPredicate>(`/predicates/${id}`);
      return response.data as UORPredicate;
    } catch (error) {
      logger.error('Error getting predicate:', error);
      throw new Error(`Failed to get predicate with ID ${id}`);
    }
  }

  /**
   * Get all topics
   * 
   * @returns All topics
   */
  async getTopics(): Promise<UORTopic[]> {
    try {
      const response = await this.axiosInstance.get<ListResponse<UORTopic>>('/topics');
      return response.data?.itemListElement?.map(item => item.item) || [];
    } catch (error) {
      logger.error('Error getting topics:', error);
      throw new Error('Failed to get topics');
    }
  }

  /**
   * Get a topic by ID
   * 
   * @param id - Topic ID
   * @returns Topic data
   */
  async getTopicById(id: string): Promise<UORTopic> {
    try {
      const response = await this.axiosInstance.get<UORTopic>(`/topics/${id}`);
      return response.data as UORTopic;
    } catch (error) {
      logger.error('Error getting topic:', error);
      throw new Error(`Failed to get topic with ID ${id}`);
    }
  }

  /**
   * Get all resources
   * 
   * @returns All resources
   */
  async getResources(): Promise<UORResource[]> {
    try {
      const response = await this.axiosInstance.get<ListResponse<UORResource>>('/resources');
      return response.data?.itemListElement?.map(item => item.item) || [];
    } catch (error) {
      logger.error('Error getting resources:', error);
      throw new Error('Failed to get resources');
    }
  }

  /**
   * Get a resource by ID
   * 
   * @param id - Resource ID
   * @returns Resource data
   */
  async getResourceById(id: string): Promise<UORResource> {
    try {
      const response = await this.axiosInstance.get<UORResource>(`/resources/${id}`);
      return response.data as UORResource;
    } catch (error) {
      logger.error('Error getting resource:', error);
      throw new Error(`Failed to get resource with ID ${id}`);
    }
  }

  /**
   * Search for content
   * 
   * @param query - Search query
   * @param type - Content type
   * @param limit - Maximum number of results
   * @returns Search results
   */
  async search(query: string, type?: string, limit?: number): Promise<unknown[]> {
    try {
      const response = await this.axiosInstance.get<ListResponse<unknown>>('/search', {
        params: {
          q: query,
          type,
          limit
        }
      });
      return response.data?.itemListElement?.map(item => item.item) || [];
    } catch (error) {
      logger.error('Error searching:', error);
      throw new Error('Failed to search');
    }
  }
}
