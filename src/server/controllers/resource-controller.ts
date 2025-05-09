/**
 * Resource Controller
 * 
 * This controller handles operations specific to the resource content type.
 * It provides methods for creating, reading, updating, and deleting resources.
 */

import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../../services/resource-service';
import { NotFoundError } from '../types/errors';

/**
 * Resource controller
 */
export const resourceController = {
  /**
   * Get all resources
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllResources: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const resourceService = new ResourceService();
      const result = await resourceService.getAllResources(page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get resource by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getResourceById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const resourceService = new ResourceService();
      const resource = await resourceService.getResourceById(id);

      if (!resource) {
        throw new NotFoundError(`Resource with ID ${id} not found`);
      }

      res.json(resource);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new resource
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createResource: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const resourceData = req.body;

      const resourceService = new ResourceService();
      const resource = await resourceService.createResource(resourceData);

      res.status(201).json(resource);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update resource by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  updateResource: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      console.log(`Updating resource with ID: ${id}`);
      
      const fullId = id.startsWith('urn:uor:resource:') ? id : `urn:uor:resource:${id}`;
      console.log(`Using full ID: ${fullId}`);
      
      const resourceData = req.body;

      const resourceService = new ResourceService();
      const resource = await resourceService.updateResource(fullId, resourceData);

      if (!resource) {
        throw new NotFoundError(`Resource with ID ${fullId} not found`);
      }

      res.json(resource);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error updating resource: ${error.message}`);
      } else {
        console.error('Unknown error updating resource');
      }
      next(error);
    }
  },

  /**
   * Delete resource by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  deleteResource: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      console.log(`Deleting resource with ID: ${id}`);
      
      const fullId = id.startsWith('urn:uor:resource:') ? id : `urn:uor:resource:${id}`;
      console.log(`Using full ID: ${fullId}`);

      const resourceService = new ResourceService();
      const success = await resourceService.deleteResource(fullId);

      if (!success) {
        throw new NotFoundError(`Resource with ID ${fullId} not found`);
      }

      res.status(204).end();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error deleting resource: ${error.message}`);
      } else {
        console.error('Unknown error deleting resource');
      }
      next(error);
    }
  }
};
