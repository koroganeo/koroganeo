import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from './error-handler';

export function validatePagination(req: Request, _res: Response, next: NextFunction): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) throw new BadRequestError('Page must be >= 1');
  if (limit < 1 || limit > 100) throw new BadRequestError('Limit must be between 1 and 100');

  req.query.page = String(page);
  req.query.limit = String(limit);
  next();
}

export function validateSearchQuery(req: Request, _res: Response, next: NextFunction): void {
  const q = req.query.q as string;
  if (!q || q.trim().length < 2) {
    throw new BadRequestError('Search query must be at least 2 characters');
  }
  next();
}
