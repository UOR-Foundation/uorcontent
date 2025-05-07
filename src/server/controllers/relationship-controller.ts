/**
 * Relationship Controller
 * 
 * This controller handles HTTP requests for relationship operations.
 * It integrates the RelationshipManager with the MCP server.
 */

import { Request, Response } from 'express';
import { RelationshipService } from '../../services/relationship-service';
import { RelationshipType } from '../../relationship-management/relationship-manager';

/**
 * Relationship controller
 */
export const relationshipController = {
  /**
   * Create a new relationship
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async createRelationship(req: Request, res: Response): Promise<void> {
    try {
      const { sourceId, targetId, predicateData } = req.body;
      
      if (!sourceId || !targetId || !predicateData) {
        res.status(400).json({
          error: 'Missing required fields: sourceId, targetId, predicateData'
        });
        return;
      }
      
      const service = new RelationshipService();
      const relationship = await service.createRelationship(
        sourceId,
        targetId,
        predicateData
      );
      
      res.status(201).json(relationship);
    } catch (error) {
      console.error('Error creating relationship:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Get relationship by ID
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async getRelationship(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing relationship ID' });
        return;
      }
      
      const service = new RelationshipService();
      const relationship = await service.getRelationship(id);
      
      if (!relationship) {
        res.status(404).json({ error: `Relationship ${id} not found` });
        return;
      }
      
      res.status(200).json(relationship);
    } catch (error) {
      console.error('Error getting relationship:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Update relationship
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async updateRelationship(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const properties = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Missing relationship ID' });
        return;
      }
      
      const service = new RelationshipService();
      const relationship = await service.updateRelationship(id, properties);
      
      if (!relationship) {
        res.status(404).json({ error: `Relationship ${id} not found` });
        return;
      }
      
      res.status(200).json(relationship);
    } catch (error) {
      console.error('Error updating relationship:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Delete relationship
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async deleteRelationship(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing relationship ID' });
        return;
      }
      
      const service = new RelationshipService();
      const deleted = await service.deleteRelationship(id);
      
      if (!deleted) {
        res.status(404).json({ error: `Relationship ${id} not found` });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * List relationships
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async listRelationships(req: Request, res: Response): Promise<void> {
    try {
      const { sourceId, targetId, type } = req.query;
      
      const filter: {
        sourceId?: string;
        targetId?: string;
        type?: RelationshipType;
      } = {};
      
      if (sourceId && typeof sourceId === 'string') {
        filter.sourceId = sourceId;
      }
      
      if (targetId && typeof targetId === 'string') {
        filter.targetId = targetId;
      }
      
      if (type && typeof type === 'string') {
        filter.type = type as RelationshipType;
      }
      
      const service = new RelationshipService();
      const relationships = await service.listRelationships(filter);
      
      res.status(200).json(relationships);
    } catch (error) {
      console.error('Error listing relationships:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Build a graph from relationships
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async buildGraph(req: Request, res: Response): Promise<void> {
    try {
      const { sourceId, targetId, type, maxDepth } = req.query;
      
      const filter: {
        sourceId?: string;
        targetId?: string;
        type?: RelationshipType;
        maxDepth?: number;
      } = {};
      
      if (sourceId && typeof sourceId === 'string') {
        filter.sourceId = sourceId;
      }
      
      if (targetId && typeof targetId === 'string') {
        filter.targetId = targetId;
      }
      
      if (type && typeof type === 'string') {
        filter.type = type as RelationshipType;
      }
      
      if (maxDepth && typeof maxDepth === 'string') {
        filter.maxDepth = parseInt(maxDepth, 10);
      }
      
      const service = new RelationshipService();
      const graph = await service.buildGraph(filter);
      
      res.status(200).json(graph);
    } catch (error) {
      console.error('Error building graph:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Find paths between two nodes
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async findPaths(req: Request, res: Response): Promise<void> {
    try {
      const { sourceId, targetId } = req.params;
      const { maxDepth } = req.query;
      
      if (!sourceId || !targetId) {
        res.status(400).json({
          error: 'Missing required parameters: sourceId, targetId'
        });
        return;
      }
      
      const service = new RelationshipService();
      const paths = await service.findPaths(
        sourceId,
        targetId,
        maxDepth && typeof maxDepth === 'string'
          ? parseInt(maxDepth, 10)
          : undefined
      );
      
      res.status(200).json(paths);
    } catch (error) {
      console.error('Error finding paths:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Validate graph for integrity
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async validateGraph(req: Request, res: Response): Promise<void> {
    try {
      const service = new RelationshipService();
      const result = await service.validateGraph();
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error validating graph:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Export graph to JSON format
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async exportGraph(req: Request, res: Response): Promise<void> {
    try {
      const { sourceId, targetId, type, maxDepth } = req.query;
      
      const filter: {
        sourceId?: string;
        targetId?: string;
        type?: RelationshipType;
        maxDepth?: number;
      } = {};
      
      if (sourceId && typeof sourceId === 'string') {
        filter.sourceId = sourceId;
      }
      
      if (targetId && typeof targetId === 'string') {
        filter.targetId = targetId;
      }
      
      if (type && typeof type === 'string') {
        filter.type = type as RelationshipType;
      }
      
      if (maxDepth && typeof maxDepth === 'string') {
        filter.maxDepth = parseInt(maxDepth, 10);
      }
      
      const service = new RelationshipService();
      const json = await service.exportGraph(filter);
      
      res.status(200).json(JSON.parse(json));
    } catch (error) {
      console.error('Error exporting graph:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
