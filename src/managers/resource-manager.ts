/**
 * Resource Manager
 * 
 * Provides enhanced CRUD operations for Resource entities with validation,
 * ID generation, and index management integration.
 * 
 * Implementation for Issue #8: Resource Manager Implementation
 */

import { FileSystem } from '../utils/file-system';
import { SchemaValidator } from '../utils/schema-validation';
import { Resource, PartialResource } from '../models/types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Filter options for listing resources
 */
export interface ResourceFilter {
  name?: string;
  author?: string;
  publisher?: string;
  keywords?: string[];
  license?: string;
  educationalLevel?: string;
  learningResourceType?: string;
}

/**
 * Event types for resource operations
 */
export enum ResourceEventType {
  CREATED = 'resource:created',
  UPDATED = 'resource:updated',
  DELETED = 'resource:deleted'
}

/**
 * Event payload for resource operations
 */
export interface ResourceEvent {
  type: ResourceEventType;
  resourceId: string;
  resource: Resource;
}

/**
 * Event listener for resource operations
 */
export type ResourceEventListener = (event: ResourceEvent) => void;

/**
 * Resource Manager class
 * Implements CRUD operations for resources with validation and indexing
 */
export class ResourceManager {
  private eventListeners: Map<ResourceEventType, ResourceEventListener[]> = new Map();
  private contentDir: string;

  /**
   * Create a new ResourceManager
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
    
    Object.values(ResourceEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * @param listener - Event listener function
   */
  addEventListener(type: ResourceEventType, listener: ResourceEventListener): void {
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
  removeEventListener(type: ResourceEventType, listener: ResourceEventListener): void {
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
   * @param resourceId - Resource ID
   * @param resource - Resource data
   */
  private emitEvent(type: ResourceEventType, resourceId: string, resource: Resource): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: ResourceEvent = { type, resourceId, resource };
    
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in resource event listener for ${type}:`, error);
      }
    }
  }

  /**
   * Generate resource ID
   * 
   * @param name - Resource name
   * @returns Generated ID in UOR-R-XXX-name format
   */
  private generateId(name: string): string {
    const code = uuidv4().substring(0, 8).toUpperCase();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `UOR-R-${code}-${safeName}`;
  }

  /**
   * Get resource file path
   * 
   * @param id - Resource ID
   * @returns Absolute file path
   */
  private getResourcePath(id: string): string {
    if (id.startsWith('urn:uor:resource:')) {
      return path.join(this.contentDir, 'resources', `${id}.json`);
    } else if (id.startsWith('UOR-R-')) {
      return path.join(this.contentDir, 'resources', `${id}.json`);
    } else {
      return path.join(this.contentDir, 'resources', `urn:uor:resource:${id}.json`);
    }
  }

  /**
   * Create a new resource
   * 
   * @param resource - Resource data
   * @returns Created resource with ID
   * @throws Error if validation fails
   */
  async create(resource: Resource): Promise<Resource> {
    const validationResult = this.validator.validateResource(resource);
    if (!validationResult.valid) {
      throw new Error(`Invalid resource: ${JSON.stringify(validationResult.errors)}`);
    }

    if (!resource['@id']) {
      const id = this.generateId(resource.name);
      resource['@id'] = `urn:uor:resource:${id}`;
    }

    const now = new Date().toISOString();
    resource.dateCreated = now;
    resource.dateModified = now;

    const filePath = this.getResourcePath(resource['@id'].split(':').pop() as string);
    await this.fileSystem.writeJsonFile(filePath, resource);

    this.emitEvent(
      ResourceEventType.CREATED, 
      resource['@id'], 
      resource
    );

    return resource;
  }

  /**
   * Read a resource by ID
   * 
   * @param id - Resource ID
   * @returns Resource data or null if not found
   */
  async read(id: string): Promise<Resource | null> {
    try {
      const filePath = this.getResourcePath(id);
      return await this.fileSystem.readJsonFile<Resource>(filePath);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'FileNotFoundError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a resource
   * 
   * @param id - Resource ID
   * @param updates - Partial resource updates
   * @param version - Optional version for optimistic concurrency
   * @returns Updated resource or null if not found
   * @throws Error if validation fails or version mismatch
   */
  async update(id: string, updates: PartialResource, version?: string): Promise<Resource | null> {
    const existing = await this.read(id);
    if (!existing) {
      return null;
    }

    if (version && existing.dateModified !== version) {
      throw new Error(`Resource ${id} was modified by another process`);
    }

    const validationResult = this.validator.validatePartial(updates, 'CreativeWork');
    if (!validationResult.valid) {
      throw new Error(`Invalid resource updates: ${JSON.stringify(validationResult.errors)}`);
    }

    const updated: Resource = { ...existing, ...updates };
    updated.dateModified = new Date().toISOString();

    const filePath = this.getResourcePath(id);
    await this.fileSystem.writeJsonFile(filePath, updated);

    this.emitEvent(
      ResourceEventType.UPDATED, 
      updated['@id'] || '', 
      updated
    );

    return updated;
  }

  /**
   * Delete a resource
   * 
   * @param id - Resource ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.read(id);
    if (!existing) {
      return false;
    }

    const filePath = this.getResourcePath(id);
    await this.fileSystem.deleteFile(filePath);

    this.emitEvent(
      ResourceEventType.DELETED, 
      existing['@id'] || '', 
      existing
    );

    return true;
  }

  /**
   * List resources with optional filtering
   * 
   * @param filter - Optional filter criteria
   * @returns Array of resources matching filter
   */
  async list(filter?: ResourceFilter): Promise<Resource[]> {
    const resourcesDir = path.join(this.contentDir, 'resources');
    const files = await this.fileSystem.listDirectory(resourcesDir);
    
    const resources: Resource[] = [];
    for (const file of files) {
      if (file.endsWith('.json') && (file.startsWith('UOR-R-') || file.startsWith('urn:uor:resource:'))) {
        try {
          const resource = await this.fileSystem.readJsonFile<Resource>(
            path.join(resourcesDir, file)
          );
          resources.push(resource);
        } catch (error) {
          console.error(`Error reading resource file ${file}:`, error);
        }
      }
    }

    if (filter) {
      return resources.filter(resource => {
        if (filter.name && !resource.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }

        if (filter.author && resource.author !== filter.author) {
          return false;
        }

        if (filter.publisher && resource.publisher !== filter.publisher) {
          return false;
        }

        if (filter.license && resource.license !== filter.license) {
          return false;
        }

        if (filter.educationalLevel && resource.educationalLevel !== filter.educationalLevel) {
          return false;
        }

        if (filter.learningResourceType && resource.learningResourceType !== filter.learningResourceType) {
          return false;
        }

        if (filter.keywords && filter.keywords.length > 0 && resource.keywords) {
          const hasAllKeywords = filter.keywords.every(keyword => 
            resource.keywords?.includes(keyword)
          );
          if (!hasAllKeywords) {
            return false;
          }
        }

        return true;
      });
    }

    return resources;
  }

  /**
   * Batch create multiple resources
   * 
   * @param resources - Array of resources to create
   * @returns Array of created resources with IDs
   */
  async batchCreate(resources: Resource[]): Promise<Resource[]> {
    for (const resource of resources) {
      const validationResult = this.validator.validateResource(resource);
      if (!validationResult.valid) {
        throw new Error(`Invalid resource: ${JSON.stringify(validationResult.errors)}`);
      }
    }

    const results: Resource[] = [];
    for (const resource of resources) {
      const created = await this.create(resource);
      results.push(created);
    }

    return results;
  }
}
