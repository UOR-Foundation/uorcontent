/**
 * Index Controller
 * 
 * Handles HTTP requests for index management operations.
 * Implements Issue #7: Index Management with incremental updates.
 */

import { Request, Response } from 'express';
import { IndexService } from '../../services/index-service';

const indexService = new IndexService();

/**
 * Generate index for content type
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const generateIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    
    if (!contentType) {
      res.status(400).json({
        error: 'Missing content type'
      });
      return;
    }
    
    const result = await indexService.generateIndex(contentType);
    res.json(result);
  } catch (error) {
    console.error('Error generating index:', error);
    res.status(500).json({
      error: 'Failed to generate index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Update index with a single item
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const updateIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    const id = req.params.id;
    const item = req.body.item;
    
    if (!contentType || !id) {
      res.status(400).json({
        error: 'Missing content type or item ID'
      });
      return;
    }
    
    const result = await indexService.updateIndex(contentType, id, item);
    res.json(result);
  } catch (error) {
    console.error('Error updating index:', error);
    res.status(500).json({
      error: 'Failed to update index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Validate index for content type
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const validateIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    
    if (!contentType) {
      res.status(400).json({
        error: 'Missing content type'
      });
      return;
    }
    
    const result = await indexService.validateIndex(contentType);
    res.json(result);
  } catch (error) {
    console.error('Error validating index:', error);
    res.status(500).json({
      error: 'Failed to validate index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Repair index for content type
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const repairIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    
    if (!contentType) {
      res.status(400).json({
        error: 'Missing content type'
      });
      return;
    }
    
    const result = await indexService.repairIndex(contentType);
    res.json(result);
  } catch (error) {
    console.error('Error repairing index:', error);
    res.status(500).json({
      error: 'Failed to repair index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Query index
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const queryIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    const query = req.body.query;
    
    if (!contentType || !query) {
      res.status(400).json({
        error: 'Missing content type or query'
      });
      return;
    }
    
    const result = await indexService.queryIndex(contentType, query);
    res.json(result);
  } catch (error) {
    console.error('Error querying index:', error);
    res.status(500).json({
      error: 'Failed to query index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Invalidate index cache
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const invalidateCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentType = req.params.contentType;
    
    const result = await indexService.invalidateCache(contentType);
    res.json(result);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      error: 'Failed to invalidate cache',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

export const indexController = {
  generateIndex,
  updateIndex,
  validateIndex,
  repairIndex,
  queryIndex,
  invalidateCache
};
