/**
 * Predicate Controller
 * 
 * This controller handles operations specific to the predicate content type.
 * It provides methods for creating, reading, updating, and deleting predicates.
 */

import { Request, Response, NextFunction } from 'express';
import { PredicateService } from '../../services/predicate-service';
import { NotFoundError } from '../types/errors';

/**
 * Predicate controller
 */
export const predicateController = {
  /**
   * Get all predicates
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllPredicates: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const predicateService = new PredicateService();
      const result = await predicateService.getAllPredicates(page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get predicate by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getPredicateById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const predicateService = new PredicateService();
      const predicate = await predicateService.getPredicateById(id);

      if (!predicate) {
        throw new NotFoundError(`Predicate with ID ${id} not found`);
      }

      res.json(predicate);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new predicate
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createPredicate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const predicateData = req.body;

      const predicateService = new PredicateService();
      const predicate = await predicateService.createPredicate(predicateData);

      res.status(201).json(predicate);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update predicate by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  updatePredicate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const predicateData = req.body;

      const predicateService = new PredicateService();
      const predicate = await predicateService.updatePredicate(id, predicateData);

      if (!predicate) {
        throw new NotFoundError(`Predicate with ID ${id} not found`);
      }

      res.json(predicate);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete predicate by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  deletePredicate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const predicateService = new PredicateService();
      const success = await predicateService.deletePredicate(id);

      if (!success) {
        throw new NotFoundError(`Predicate with ID ${id} not found`);
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
};
