/**
 * JSON-RPC Middleware
 * 
 * This middleware processes JSON-RPC requests according to the MCP specification.
 */

import { Request, Response, NextFunction } from 'express';
import { JSONRPCHandler } from '../utils/json-rpc-handler';
import { MCPValidationService } from '../services/validation-service';

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
        next();
        return;
      }

      const validator = new MCPValidationService();
      const validationResult = validator.validateJSONRPC(req.body);

      if (!validationResult.valid) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32600,
            message: 'Invalid JSON-RPC request',
            data: {
              errors: validationResult.errors
            }
          }
        });
        return;
      }

      const response = await handler.handleRequest(req.body);
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};
