export interface ArticleListResponse {
  articles: import('./article.interface').ArticleMetadata[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ArticleDetailResponse {
  article: import('./article.interface').ArticleMetadata;
  contentVi: string;
  contentEn: string;
}

export interface SearchResponse {
  results: import('./article.interface').ArticleMetadata[];
  highlights: Record<string, string[]>;
}

export interface MetadataResponse {
  values: string[];
  counts: Record<string, number>;
}

export interface StatsResponse {
  totalArticles: number;
  byGenre: Record<string, number>;
  byCreator: Record<string, number>;
  avgLength: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  genre?: string;
  tags?: string[];
  creators?: string[];
  difficulty?: string;
  lang?: 'vi' | 'en';
  sortBy?: 'date' | 'length' | 'title';
  sortOrder?: 'asc' | 'desc';
}
