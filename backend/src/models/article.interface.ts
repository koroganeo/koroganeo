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
