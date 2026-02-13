import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ArticleMetadata, ArticleListResponse, ArticleDetailResponse } from '../models/article.model';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  // State signals
  articles = signal<ArticleMetadata[]>([]);
  total = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filter signals
  selectedGenre = signal<string | null>(null);
  selectedTags = signal<string[]>([]);
  selectedCreators = signal<string[]>([]);
  difficulty = signal<string | null>(null);
  sortBy = signal<'date' | 'length' | 'title'>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Computed
  hasActiveFilters = computed(() =>
    this.selectedGenre() !== null ||
    this.selectedTags().length > 0 ||
    this.selectedCreators().length > 0 ||
    this.difficulty() !== null
  );

  totalPages = computed(() => Math.ceil(this.total() / 20));

  hasMore = computed(() => this.currentPage() < this.totalPages());

  async loadArticles(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      let params = new HttpParams()
        .set('page', this.currentPage().toString())
        .set('limit', '20')
        .set('lang', this.languageService.current())
        .set('sortBy', this.sortBy())
        .set('sortOrder', this.sortOrder());

      const genre = this.selectedGenre();
      if (genre) params = params.set('genre', genre);

      const difficulty = this.difficulty();
      if (difficulty) params = params.set('difficulty', difficulty);

      for (const tag of this.selectedTags()) {
        params = params.append('tags', tag);
      }

      for (const creator of this.selectedCreators()) {
        params = params.append('creators', creator);
      }

      const response = await firstValueFrom(
        this.http.get<ArticleListResponse>('/api/articles', { params })
      );

      this.articles.set(response.articles);
      this.total.set(response.total);
    } catch (err) {
      this.error.set('Failed to load articles');
      console.error('Error loading articles:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async getArticle(slug: string): Promise<ArticleDetailResponse | null> {
    try {
      return await firstValueFrom(
        this.http.get<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(slug)}`)
      );
    } catch (err) {
      console.error('Error loading article:', err);
      return null;
    }
  }

  clearFilters(): void {
    this.selectedGenre.set(null);
    this.selectedTags.set([]);
    this.selectedCreators.set([]);
    this.difficulty.set(null);
    this.currentPage.set(1);
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(tags =>
      tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag]
    );
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }
}
