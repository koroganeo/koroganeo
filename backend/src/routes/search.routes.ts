import { Router, Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { validateSearchQuery } from '../middleware/validate';

export function createSearchRouter(searchService: SearchService): Router {
  const router = Router();

  // GET /api/search?q=term&lang=vi
  router.get('/', validateSearchQuery, async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const lang = (req.query.lang as string) === 'en' ? 'en' : 'vi';
    const limit = parseInt(req.query.limit as string) || 20;

    const results = searchService.search(query, lang, limit);

    res.json(results);
  });

  return router;
}
