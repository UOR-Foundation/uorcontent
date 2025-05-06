/**
 * Query Controller
 * 
 * Handles HTTP requests for query operations.
 * Implements Issue #6: Query Operations with pluggable providers.
 */

import { Request, Response } from 'express';
import { QueryService } from '../../services/query-service';

const queryService = new QueryService();

/**
 * Filter content
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const filterContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const criteria = req.body.criteria;
    const provider = req.query.provider as string | undefined;
    
    if (!criteria) {
      res.status(400).json({
        error: 'Missing filter criteria'
      });
      return;
    }
    
    const result = await queryService.filterContent(criteria, provider);
    res.json(result);
  } catch (error) {
    console.error('Error filtering content:', error);
    res.status(500).json({
      error: 'Failed to filter content',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Search content
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const searchContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const provider = req.query.provider as string | undefined;
    
    if (!query) {
      res.status(400).json({
        error: 'Missing search query'
      });
      return;
    }
    
    const result = await queryService.searchContent(query, provider);
    res.json(result);
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({
      error: 'Failed to search content',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Paginate content
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const paginateContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const options = req.body.pagination;
    const filter = req.body.filter;
    const provider = req.query.provider as string | undefined;
    
    if (!options) {
      res.status(400).json({
        error: 'Missing pagination options'
      });
      return;
    }
    
    const result = await queryService.paginateContent(options, filter, provider);
    res.json(result);
  } catch (error) {
    console.error('Error paginating content:', error);
    res.status(500).json({
      error: 'Failed to paginate content',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Sort content
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const sortContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const options = req.body.sort;
    const filter = req.body.filter;
    const provider = req.query.provider as string | undefined;
    
    if (!options) {
      res.status(400).json({
        error: 'Missing sort options'
      });
      return;
    }
    
    const result = await queryService.sortContent(options, filter, provider);
    res.json(result);
  } catch (error) {
    console.error('Error sorting content:', error);
    res.status(500).json({
      error: 'Failed to sort content',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Execute query
 * 
 * @param req - HTTP request
 * @param res - HTTP response
 */
export const executeQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = req.body.filter;
    const search = req.body.search;
    const pagination = req.body.pagination;
    const sort = req.body.sort;
    const provider = req.query.provider as string | undefined;
    
    const result = await queryService.executeQuery(
      filter,
      search,
      pagination,
      sort,
      provider
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({
      error: 'Failed to execute query',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

export const queryController = {
  filterContent,
  searchContent,
  paginateContent,
  sortContent,
  executeQuery
};
