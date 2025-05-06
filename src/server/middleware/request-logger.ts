/**
 * Request Logger Middleware
 * 
 * This middleware logs incoming requests for debugging purposes.
 * It captures request method, path, and timing information.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  
  next();
};
