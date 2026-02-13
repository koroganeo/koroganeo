import { Router, Request, Response } from 'express';
import { ExcelService } from '../services/excel.service';
import { CacheService } from '../services/cache.service';
import { ArticleMetadata } from '../models/article.interface';
import { NotFoundError } from '../middleware/error-handler';
import { validatePagination } from '../middleware/validate';
import { normalizeVietnamese } from '../utils/vietnamese.utils';

export function createArticlesRouter(
  excelService: ExcelService,
  cacheService: CacheService
): Router {
  const router = Router();

  // GET /api/articles - List articles with filtering, sorting, pagination
  router.get('/', validatePagination, async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const genre = req.query.genre as string | undefined;
    const tags = req.query.tags
      ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string])
      : undefined;
    const creators = req.query.creators
      ? (Array.isArray(req.query.creators) ? req.query.creators as string[] : [req.query.creators as string])
      : undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const lang = (req.query.lang as string) === 'en' ? 'en' : 'vi';
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    let articles = excelService.getAllMetadata();

    // Filter by genre
    if (genre) {
      articles = articles.filter(a => a.genres === genre);
    }

    // Filter by tags (any match)
    if (tags && tags.length > 0) {
      articles = articles.filter(a =>
        tags.some(tag => a.tags.includes(tag))
      );
    }

    // Filter by creators
    if (creators && creators.length > 0) {
      articles = articles.filter(a =>
        creators.some(c => a.creators.includes(c))
      );
    }

    // Filter by difficulty
    if (difficulty) {
      articles = articles.filter(a => a.difficultyLevel === difficulty);
    }

    // Sort
    articles = sortArticles(articles, sortBy, sortOrder, lang);

    // Paginate
    const total = articles.length;
    const start = (page - 1) * limit;
    const paginatedArticles = articles.slice(start, start + limit);
    const hasMore = start + limit < total;

    res.json({
      articles: paginatedArticles,
      total,
      page,
      hasMore,
    });
  });

  // GET /api/articles/:slug - Get single article with content
  router.get('/:slug', async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const cached = cacheService.getArticle(slug);

    if (!cached) {
      // Try to find by partial match in metadata
      const allMetadata = excelService.getAllMetadata();
      const match = allMetadata.find(a => a.slug === slug || a.slug.includes(slug));
      if (!match) {
        throw new NotFoundError('Article not found');
      }

      const matchedCached = cacheService.getArticle(match.slug);
      if (!matchedCached) {
        throw new NotFoundError('Article content not found');
      }

      res.json({
        article: matchedCached.metadata,
        content: matchedCached.content,
      });
      return;
    }

    res.json({
      article: cached.metadata,
      content: cached.content,
    });
  });

  return router;
}

function sortArticles(
  articles: ArticleMetadata[],
  sortBy: string,
  sortOrder: string,
  lang: string
): ArticleMetadata[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return [...articles].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'length':
        return multiplier * (a.length - b.length);
      case 'title': {
        const titleA = lang === 'en' ? (a.titleEn || a.titleVi) : a.titleVi;
        const titleB = lang === 'en' ? (b.titleEn || b.titleVi) : b.titleVi;
        return multiplier * normalizeVietnamese(titleA).localeCompare(normalizeVietnamese(titleB));
      }
      default:
        return 0;
    }
  });
}
