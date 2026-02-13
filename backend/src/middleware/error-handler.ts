import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${statusCode}] ${message}`, { stack: err.stack });

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
    },
  });
}
