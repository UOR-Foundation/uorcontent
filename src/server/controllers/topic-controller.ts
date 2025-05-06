/**
 * Topic Controller
 * 
 * This controller handles operations specific to the topic content type.
 * It provides methods for creating, reading, updating, and deleting topics.
 */

import { Request, Response, NextFunction } from 'express';
import { TopicService } from '../../services/topic-service';
import { NotFoundError } from '../types/errors';

/**
 * Topic controller
 */
export const topicController = {
  /**
   * Get all topics
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllTopics: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const topicService = new TopicService();
      const result = await topicService.getAllTopics(page, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get topic by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getTopicById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const topicService = new TopicService();
      const topic = await topicService.getTopicById(id);

      if (!topic) {
        throw new NotFoundError(`Topic with ID ${id} not found`);
      }

      res.json(topic);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new topic
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createTopic: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const topicData = req.body;

      const topicService = new TopicService();
      const topic = await topicService.createTopic(topicData);

      res.status(201).json(topic);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update topic by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  updateTopic: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const topicData = req.body;

      const topicService = new TopicService();
      const topic = await topicService.updateTopic(id, topicData);

      if (!topic) {
        throw new NotFoundError(`Topic with ID ${id} not found`);
      }

      res.json(topic);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete topic by ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  deleteTopic: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;

      const topicService = new TopicService();
      const success = await topicService.deleteTopic(id);

      if (!success) {
        throw new NotFoundError(`Topic with ID ${id} not found`);
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
};
