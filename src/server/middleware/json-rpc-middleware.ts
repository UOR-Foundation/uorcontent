/**
 * JSON-RPC Middleware
 * 
 * This middleware processes JSON-RPC requests according to the MCP specification.
 */

import { Request, Response, NextFunction } from 'express';
import { JSONRPCHandler } from '../utils/json-rpc-handler';
import { ValidationError } from '../types/errors';
import { MCPSchemaValidator } from '../utils/mcp-schema-validator';

/**
 * Create JSON-RPC middleware
 * 
 * @param handler - JSON-RPC handler instance
 * @returns Express middleware function
 */
export const createJSONRPCMiddleware = (handler: JSONRPCHandler) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        return next();
      }

      const validator = MCPSchemaValidator.getInstance();
      const validationResult = await validator.validateRequest(
        req.method,
        req.path,
        req.body
      );

      if (!validationResult.valid) {
        throw new ValidationError(
          'Invalid JSON-RPC request',
          (validationResult.errors || []).map(error => error as unknown as Record<string, unknown>)
        );
      }

      const response = await handler.handleRequest(req.body);
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};
