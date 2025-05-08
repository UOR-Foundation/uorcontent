/**
 * Concept Controller
 * 
 * This controller handles operations specific to the concept content type.
 * It provides methods for creating, reading, updating, and deleting concepts.
 */

import { Request, Response, NextFunction } from 'express';
import { ConceptService } from '../../services/concept-service';
import { NotFoundError } from '../types/errors';

/**
 * Concept controller
 */
export const conceptController = {
  /**
   * Get all concepts
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllConcepts: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conceptService = new ConceptService();
      const result = await conceptService.getAllConcepts(page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get concept by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getConceptById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      console.log(`Getting concept with ID: ${id}`);
      
      const fullId = id.startsWith('urn:uor:concept:') ? id : `urn:uor:concept:${id}`;
      console.log(`Using full ID: ${fullId}`);

      const conceptService = new ConceptService();
      const concept = await conceptService.getConceptById(fullId);

      if (!concept) {
        console.log(`Concept not found with ID: ${fullId}`);
        throw new NotFoundError(`Concept with ID ${fullId} not found`);
      }

      res.json(concept);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error getting concept: ${error.message}`);
      } else {
        console.error('Unknown error getting concept');
      }
      next(error);
    }
  },

  /**
   * Create new concept
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createConcept: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const conceptData = req.body;

      const conceptService = new ConceptService();
      const concept = await conceptService.createConcept(conceptData);

      res.status(201).json(concept);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update concept by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  updateConcept: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      console.log(`Updating concept with ID: ${id}`);
      
      const fullId = id.startsWith('urn:uor:concept:') ? id : `urn:uor:concept:${id}`;
      console.log(`Using full ID: ${fullId}`);
      
      const conceptData = req.body;

      const conceptService = new ConceptService();
      const concept = await conceptService.updateConcept(fullId, conceptData);

      if (!concept) {
        throw new NotFoundError(`Concept with ID ${fullId} not found`);
      }

      res.json(concept);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error updating concept: ${error.message}`);
      } else {
        console.error('Unknown error updating concept');
      }
      next(error);
    }
  },

  /**
   * Delete concept by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  deleteConcept: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      console.log(`Deleting concept with ID: ${id}`);
      
      const fullId = id.startsWith('urn:uor:concept:') ? id : `urn:uor:concept:${id}`;
      console.log(`Using full ID: ${fullId}`);

      const conceptService = new ConceptService();
      const success = await conceptService.deleteConcept(fullId);

      if (!success) {
        throw new NotFoundError(`Concept with ID ${fullId} not found`);
      }

      res.status(204).end();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error deleting concept: ${error.message}`);
      } else {
        console.error('Unknown error deleting concept');
      }
      next(error);
    }
  }
};
