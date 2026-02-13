export interface ArticleMetadata {
  genres: string;
  titleVi: string;
  titleEn: string;
  tags: string[];
  slug: string;
  page: number;
  difficultyLevel: string;
  creators: string[];
  createdAt: Date;
  crawlStatus: string;
  length: number;
}

export interface Article extends ArticleMetadata {
  content?: string;
}

export interface ArticleListResponse {
  articles: ArticleMetadata[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface ArticleDetailResponse {
  article: ArticleMetadata;
  content: string;
}

export interface SearchResponse {
  results: ArticleMetadata[];
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
