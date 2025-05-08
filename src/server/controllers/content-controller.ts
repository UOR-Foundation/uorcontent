/**
 * Content Controller
 * 
 * This controller handles operations for all content types.
 * It provides methods for creating, reading, updating, and deleting content.
 */

import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../../services/content-service';
import { UORContentItem } from '../../models/types';
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

      console.log(`Query parameters: page=${page}, limit=${limit}, type=${type}, name=${name}`);

      if (name) {
        console.log(`Direct name query${type ? ` for type ${type}` : ''}: ${name}`);
        
        const fs = require('fs');
        const path = require('path');
        const contentDir = process.env.CONTENT_DIR || 'converted';
        
        let matchingItems: UORContentItem[] = [];
        
        const typesToScan = type ? [type] : ['concept', 'resource', 'topic', 'predicate'];
        
        for (const contentType of typesToScan) {
          const typeDir = path.join(contentDir, `${contentType}s`);
          console.log(`Scanning directory: ${typeDir}`);
          
          try {
            if (fs.existsSync(typeDir)) {
              const files = fs.readdirSync(typeDir);
              console.log(`Found ${files.length} files in ${typeDir}`);
              
              for (const file of files) {
                if (file.endsWith('.json')) {
                  try {
                    const filePath = path.join(typeDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const item = JSON.parse(content) as UORContentItem;
                    
                    if (item.name === name) {
                      console.log(`DIRECT MATCH FOUND: ${item.name} (ID: ${item['@id']})`);
                      matchingItems.push(item);
                    }
                  } catch (error) {
                    console.error(`Error reading file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error scanning directory ${typeDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        console.log(`Found ${matchingItems.length} items matching name "${name}"${type ? ` for type ${type}` : ''}`);
        
        matchingItems.forEach((item: UORContentItem) => {
          console.log(`Match: ${item.name} (ID: ${item['@id']})`);
        });
        
        res.json(matchingItems);
        return;
      }
      
      const contentService = new ContentService();
      await contentService.refreshContent();
      
      const result = await contentService.getAllContent(page, limit, type, name);
      
      if (result['@type'] === 'ItemList' && Array.isArray(result.itemListElement)) {
        const items = result.itemListElement.map((listItem: any) => listItem.item);
        console.log(`Returning ${items.length} items from ItemList`);
        res.json(items);
      } else {
        console.log(`Result is not an ItemList, returning directly`);
        res.json(result);
      }
    } catch (error) {
      console.error(`Error in getAllContent: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
