import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@misarh/shared';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err);

  const error = err as ApiError;
  const statusCode = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code,
    },
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  _req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
};
