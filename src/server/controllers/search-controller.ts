/**
 * Search Controller
 * 
 * This controller handles search operations across all content types.
 * It provides methods for basic search, advanced search, and type-specific search.
 */

import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../../services/search-service';

/**
 * Search controller
 */
export const searchController = {
  /**
   * Basic search across all content types
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  search: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const searchService = new SearchService();
      const results = await searchService.search(query, page, limit);

      res.json(results);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Advanced search with multiple criteria
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  advancedSearch: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query.q as string;
      const types = (req.query.types as string || '').split(',').filter(Boolean);
      const properties = req.query.properties ? JSON.parse(req.query.properties as string) : {};
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const searchService = new SearchService();
      const results = await searchService.advancedSearch(
        query,
        types,
        properties,
        page,
        limit
      );

      res.json(results);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search by content type
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  searchByType: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const type = req.params.type;
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const searchService = new SearchService();
      const results = await searchService.searchByType(
        type,
        query,
        page,
        limit
      );

      res.json(results);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search by property values
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  searchByProperty: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const property = req.query.property as string;
      const value = req.query.value as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const searchService = new SearchService();
      const results = await searchService.searchByProperty(
        property,
        value,
        page,
        limit
      );

      res.json(results);
    } catch (error) {
      next(error);
    }
  }
};
