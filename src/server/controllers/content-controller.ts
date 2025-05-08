/**
 * Content Controller
 * 
 * This controller handles operations for all content types.
 * It provides methods for creating, reading, updating, and deleting content.
 */

import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../../services/content-service';
import { NotFoundError } from '../types/errors';

/**
 * Content controller
 */
export const contentController = {
  /**
   * Get all content
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const name = req.query.name as string;

      const contentService = new ContentService();
      const result = await contentService.getAllContent(page, limit, type);
      
      if (result['@type'] === 'ItemList' && Array.isArray(result.itemListElement)) {
        let items = result.itemListElement.map((listItem: any) => listItem.item);
        
        if (name) {
          items = items.filter(item => item.name === name);
        }
        
        res.json(items);
      } else {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get content by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getContentById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const contentService = new ContentService();
      const content = await contentService.getContentById(id);

      if (!content) {
        throw new NotFoundError(`Content with ID ${id} not found`);
      }

      res.json(content);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new content
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contentData = req.body;

      const contentService = new ContentService();
      const content = await contentService.createContent(contentData);

      res.status(201).json(content);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update content by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  updateContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const contentData = req.body;

      const contentService = new ContentService();
      const content = await contentService.updateContent(id, contentData);

      if (!content) {
        throw new NotFoundError(`Content with ID ${id} not found`);
      }

      res.json(content);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete content by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  deleteContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const contentService = new ContentService();
      const success = await contentService.deleteContent(id);

      if (!success) {
        throw new NotFoundError(`Content with ID ${id} not found`);
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
};
