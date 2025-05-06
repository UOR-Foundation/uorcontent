/**
 * Request Validation Middleware
 * 
 * This middleware validates incoming requests against the MCP schema.
 * It ensures that all requests conform to the expected structure and
 * contain valid parameters for the requested operation.
 */

import { Request, Response, NextFunction } from 'express';
import { MCPSchemaValidator } from '../utils/mcp-schema-validator';
import { ValidationError } from '../types/errors';

/**
 * Validate request middleware
 * 
 * Validates incoming requests against the MCP schema
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.method === 'GET') {
      return next();
    }

    const endpoint = req.path.split('/').filter(Boolean).join('/');
    
    const validator = MCPSchemaValidator.getInstance();
    const validationResult = await validator.validateRequest(
      req.method,
      endpoint,
      req.body
    );

    if (!validationResult.valid) {
      throw new ValidationError(
        'Invalid request',
        validationResult.errors || []
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
