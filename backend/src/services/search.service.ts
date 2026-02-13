import { ArticleMetadata } from '../models/article.interface';
import { CacheService } from './cache.service';
import { ExcelService } from './excel.service';
import { normalizeVietnamese } from '../utils/vietnamese.utils';

export interface SearchResult {
  results: ArticleMetadata[];
  highlights: Record<string, string[]>;
  total: number;
}

export class SearchService {
  constructor(
    private cacheService: CacheService,
    private excelService: ExcelService
  ) {}

  search(query: string, lang: 'vi' | 'en' = 'vi', limit: number = 20): SearchResult {
    if (!query || query.trim().length < 2) {
      return { results: [], highlights: {}, total: 0 };
    }

    const normalizedQuery = normalizeVietnamese(query.toLowerCase().trim());
    const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

    // Get candidate slugs from search index
    const candidateSlugs = this.cacheService.searchByTerms(queryTerms);

    // Score and rank results
    const scored: { metadata: ArticleMetadata; score: number; highlights: string[] }[] = [];

    for (const slug of candidateSlugs) {
      const cached = this.cacheService.getArticle(slug);
      if (!cached) continue;

      const { metadata, textContent } = cached;
      let score = 0;
      const highlights: string[] = [];

      // Score title matches (highest weight)
      const titleField = lang === 'en' ? metadata.titleEn : metadata.titleVi;
      const normalizedTitle = normalizeVietnamese((titleField || '').toLowerCase());

      for (const term of queryTerms) {
        if (normalizedTitle.includes(term)) {
          score += 10;
          highlights.push(titleField);
        }
      }

      // Score content matches
      const normalizedContent = normalizeVietnamese(textContent.toLowerCase());
      for (const term of queryTerms) {
        if (normalizedContent.includes(term)) {
          score += 1;
          // Extract snippet around match
          const idx = normalizedContent.indexOf(term);
          if (idx !== -1) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(textContent.length, idx + term.length + 50);
            highlights.push('...' + textContent.slice(start, end) + '...');
          }
        }
      }

      // Score tag matches
      for (const tag of metadata.tags) {
        const normalizedTag = normalizeVietnamese(tag.toLowerCase());
        for (const term of queryTerms) {
          if (normalizedTag.includes(term)) {
            score += 5;
          }
        }
      }

      if (score > 0) {
        scored.push({ metadata, score, highlights: highlights.slice(0, 3) });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, limit);
    const highlightsMap: Record<string, string[]> = {};
    topResults.forEach(r => {
      highlightsMap[r.metadata.slug] = r.highlights;
    });

    return {
      results: topResults.map(r => r.metadata),
      highlights: highlightsMap,
      total: scored.length,
    };
  }
}
