/**
 * UOR Resource Manager
 * 
 * Manager for UOR resources in the MCP server
 */

import { UORService } from './uor-service';
import { Resource, ResourceTemplate } from '@modelcontextprotocol/sdk/types';

/**
 * UOR Resource Manager
 * 
 * Manager for UOR resources in the MCP server
 */
export class UORResourceManager {
  private uorService: UORService;

  /**
   * Create a new resource manager
   * 
   * @param uorService - UOR service
   */
  constructor(uorService: UORService) {
    this.uorService = uorService;
  }

  /**
   * List available resources
   * 
   * @returns List of available resources
   */
  async listResources(): Promise<Resource[]> {
    try {
      const concepts = await this.uorService.getConcepts();
      const predicates = await this.uorService.getPredicates();
      const topics = await this.uorService.getTopics();
      const resources = await this.uorService.getResources();
      
      const mcpResources: Resource[] = [];
      
      concepts.forEach(concept => {
        mcpResources.push({
          uri: `uor://concept/${concept['@id'].split(':').pop()}`,
          name: concept.name,
          description: concept.description,
          mimeType: 'application/json'
        });
      });
      
      predicates.forEach(predicate => {
        mcpResources.push({
          uri: `uor://predicate/${predicate['@id'].split(':').pop()}`,
          name: predicate.name,
          description: predicate.description,
          mimeType: 'application/json'
        });
      });
      
      topics.forEach(topic => {
        mcpResources.push({
          uri: `uor://topic/${topic['@id'].split(':').pop()}`,
          name: topic.name,
          description: topic.description,
          mimeType: 'application/json'
        });
      });
      
      resources.forEach(resource => {
        mcpResources.push({
          uri: `uor://resource/${resource['@id'].split(':').pop()}`,
          name: resource.name,
          description: resource.description,
          mimeType: 'application/json'
        });
      });
      
      return mcpResources;
    } catch (error) {
      console.error('Error listing resources:', error);
      throw new Error('Failed to list resources');
    }
  }

  /**
   * List resource templates
   * 
   * @returns List of resource templates
   */
  async listResourceTemplates(): Promise<ResourceTemplate[]> {
    return [
      {
        uriTemplate: 'uor://concept/{id}',
        name: 'UOR Concept',
        description: 'A concept in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://predicate/{id}',
        name: 'UOR Predicate',
        description: 'A predicate in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://topic/{id}',
        name: 'UOR Topic',
        description: 'A topic in the Universal Object Reference framework',
        mimeType: 'application/json'
      },
      {
        uriTemplate: 'uor://resource/{id}',
        name: 'UOR Resource',
        description: 'A resource in the Universal Object Reference framework',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Read a resource
   * 
   * @param uri - Resource URI
   * @returns Resource content
   */
  async readResource(uri: string): Promise<Array<{ uri: string; mimeType: string; text: string }>> {
    try {
      const match = uri.match(/^uor:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        throw new Error(`Invalid URI format: ${uri}`);
      }

      const [, type, id] = match;
      let data: any;

      switch (type) {
        case 'concept':
          data = await this.uorService.getConceptById(`urn:uor:concept:${id}`);
          break;
        case 'predicate':
          data = await this.uorService.getPredicateById(`urn:uor:predicate:${id}`);
          break;
        case 'topic':
          data = await this.uorService.getTopicById(`urn:uor:topic:${id}`);
          break;
        case 'resource':
          data = await this.uorService.getResourceById(`urn:uor:resource:${id}`);
          break;
        default:
          throw new Error(`Unknown resource type: ${type}`);
      }

      return [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }];
    } catch (error) {
      console.error('Error reading resource:', error);
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
