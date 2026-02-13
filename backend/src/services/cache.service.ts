import { ArticleMetadata } from '../models/article.interface';
import { ExcelService } from './excel.service';
import { WordService } from './word.service';
import { normalizeVietnamese, tokenize } from '../utils/vietnamese.utils';
import { cacheConfig } from '../config/database.config';
import { logger } from '../utils/logger';

interface CachedArticle {
  content: string;
  textContent: string;
  metadata: ArticleMetadata;
}

export class CacheService {
  private articleCache: Map<string, CachedArticle> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // normalized word -> slugs

  async warmUp(excelService: ExcelService, wordService: WordService): Promise<void> {
    const allMetadata = excelService.getAllMetadata();
    logger.info(`Warming up cache for ${allMetadata.length} articles...`);

    const batchSize = cacheConfig.batchSize;
    let processed = 0;

    for (let i = 0; i < allMetadata.length; i += batchSize) {
      const batch = allMetadata.slice(i, i + batchSize);
      await Promise.all(
        batch.map(meta => this.cacheArticle(meta, wordService))
      );
      processed += batch.length;
      logger.info(`Cache progress: ${processed}/${allMetadata.length}`);
    }

    logger.info(`Cache warm-up complete. ${this.articleCache.size} articles cached, ${this.searchIndex.size} search terms indexed.`);
  }

  private async cacheArticle(metadata: ArticleMetadata, wordService: WordService): Promise<void> {
    try {
      const content = await wordService.parseWordFile(metadata.slug, metadata.titleVi);
      const textContent = await wordService.parseWordFileAsText(metadata.slug, metadata.titleVi);

      this.articleCache.set(metadata.slug, { content, textContent, metadata });
      this.indexForSearch(metadata.slug, metadata, textContent);
    } catch (err) {
      logger.warn(`Failed to cache article ${metadata.slug}: ${(err as Error).message}`);
    }
  }

  private indexForSearch(slug: string, metadata: ArticleMetadata, textContent: string): void {
    const searchableText = [
      metadata.titleVi,
      metadata.titleEn,
      metadata.genres,
      metadata.tags.join(' '),
      metadata.creators.join(' '),
      textContent,
    ].join(' ');

    const words = tokenize(searchableText);
    const uniqueWords = new Set(words);

    for (const word of uniqueWords) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(slug);
    }
  }

  getArticle(slug: string): CachedArticle | undefined {
    return this.articleCache.get(slug);
  }

  getArticleContent(slug: string): string | undefined {
    return this.articleCache.get(slug)?.content;
  }

  getAllCachedArticles(): CachedArticle[] {
    return Array.from(this.articleCache.values());
  }

  searchByTerms(terms: string[]): Set<string> {
    const normalizedTerms = terms.map(t => normalizeVietnamese(t.toLowerCase()));
    const results = new Set<string>();

    for (const term of normalizedTerms) {
      // Exact match
      const exactMatches = this.searchIndex.get(term);
      if (exactMatches) {
        exactMatches.forEach(slug => results.add(slug));
      }

      // Partial match
      for (const [indexedWord, slugs] of this.searchIndex) {
        if (indexedWord.includes(term) || term.includes(indexedWord)) {
          slugs.forEach(slug => results.add(slug));
        }
      }
    }

    return results;
  }

  getSize(): number {
    return this.articleCache.size;
  }
}
