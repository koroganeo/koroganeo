import { Router, Request, Response } from 'express';
import { ExcelService } from '../services/excel.service';
import { BadRequestError } from '../middleware/error-handler';

export function createMetadataRouter(excelService: ExcelService): Router {
  const router = Router();

  // GET /api/metadata?field=genres|tags|creators|difficultyLevels
  router.get('/', async (req: Request, res: Response) => {
    const field = req.query.field as string;
    const validFields = ['genres', 'tags', 'creators', 'difficultyLevels'];

    if (!field || !validFields.includes(field)) {
      throw new BadRequestError(`Field must be one of: ${validFields.join(', ')}`);
    }

    const allMetadata = excelService.getAllMetadata();
    const counts: Record<string, number> = {};

    for (const article of allMetadata) {
      switch (field) {
        case 'genres':
          if (article.genres) {
            counts[article.genres] = (counts[article.genres] || 0) + 1;
          }
          break;
        case 'tags':
          for (const tag of article.tags) {
            counts[tag] = (counts[tag] || 0) + 1;
          }
          break;
        case 'creators':
          for (const creator of article.creators) {
            counts[creator] = (counts[creator] || 0) + 1;
          }
          break;
        case 'difficultyLevels':
          if (article.difficultyLevel) {
            counts[article.difficultyLevel] = (counts[article.difficultyLevel] || 0) + 1;
          }
          break;
      }
    }

    // Sort by count descending
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

    res.json({
      values: sorted.map(([key]) => key),
      counts: Object.fromEntries(sorted),
    });
  });

  // GET /api/stats
  router.get('/stats', async (_req: Request, res: Response) => {
    const allMetadata = excelService.getAllMetadata();

    const byGenre: Record<string, number> = {};
    const byCreator: Record<string, number> = {};
    let totalLength = 0;

    for (const article of allMetadata) {
      if (article.genres) {
        byGenre[article.genres] = (byGenre[article.genres] || 0) + 1;
      }
      for (const creator of article.creators) {
        byCreator[creator] = (byCreator[creator] || 0) + 1;
      }
      totalLength += article.length || 0;
    }

    res.json({
      totalArticles: allMetadata.length,
      byGenre,
      byCreator,
      avgLength: allMetadata.length > 0 ? Math.round(totalLength / allMetadata.length) : 0,
    });
  });

  return router;
}
