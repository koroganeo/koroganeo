import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { ExcelService } from './services/excel.service';
import { WordService } from './services/word.service';
import { CacheService } from './services/cache.service';
import { SearchService } from './services/search.service';
import { createArticlesRouter } from './routes/articles.routes';
import { createMetadataRouter } from './routes/metadata.routes';
import { createSearchRouter } from './routes/search.routes';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../MonsterBox');
const EXCEL_FILE = process.env.EXCEL_FILE || path.join(DATA_DIR, 'MonsterBox_articles_metadata.xlsx');

async function bootstrap(): Promise<void> {
  const app = express();

  // Security & compression middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Initialize services
  logger.info('Initializing services...');

  const excelService = new ExcelService();
  await excelService.loadMetadata(EXCEL_FILE);

  const wordService = new WordService(DATA_DIR);
  await wordService.buildFileIndex();

  const cacheService = new CacheService();
  await cacheService.warmUp(excelService, wordService);

  const searchService = new SearchService(cacheService, excelService);

  // API routes
  app.use('/api/articles', createArticlesRouter(excelService, cacheService));
  app.use('/api/metadata', createMetadataRouter(excelService));
  app.use('/api/search', createSearchRouter(searchService));

  // Serve frontend static files in production
  const publicDir = path.resolve(__dirname, '../../frontend/dist/frontend/browser');
  app.use(express.static(publicDir));
  app.get('*', (_req, res, next) => {
    const indexPath = path.join(publicDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  });

  // Global error handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`MonsterBox API running on http://localhost:${PORT}`);
    logger.info(`Loaded ${excelService.getAllMetadata().length} articles`);
    logger.info(`Cached ${cacheService.getSize()} article contents`);
  });
}

bootstrap().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
