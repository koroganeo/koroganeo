import { Component, inject, signal, OnInit } from '@angular/core';
import { ArticleService } from '../../core/services/article.service';
import { MetadataService } from '../../core/services/metadata.service';
import { LanguageService } from '../../core/services/language.service';
import { ArticleCardComponent } from './article-card.component';
import { FilterPanelComponent } from './filter-panel.component';
import { SidebarComponent } from '../layout/sidebar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { TagChipComponent } from '../../shared/components/tag-chip.component';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    ArticleCardComponent,
    FilterPanelComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    PaginationComponent,
    TagChipComponent,
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">
            {{ lang.current() === 'vi' ? 'Bài viết' : 'Articles' }}
          </h1>
          @if (articleService.total() > 0) {
            <p class="text-sm text-slate-500 mt-1">
              {{ articleService.total() }}
              {{ lang.current() === 'vi' ? 'bài viết' : 'articles' }}
            </p>
          }
        </div>
        <button
          (click)="showFilters.set(!showFilters())"
          class="px-4 py-2 rounded border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors">
          {{ showFilters()
            ? (lang.current() === 'vi' ? 'Ẩn bộ lọc' : 'Hide filters')
            : (lang.current() === 'vi' ? 'Hiện bộ lọc' : 'Show filters')
          }}
        </button>
      </header>

      <!-- Active filter chips -->
      @if (articleService.hasActiveFilters()) {
        <div class="flex flex-wrap gap-2 mb-4">
          @if (articleService.selectedGenre(); as genre) {
            <app-tag-chip [label]="genre" [removable]="true" (remove)="clearGenre()" />
          }
          @for (tag of articleService.selectedTags(); track tag) {
            <app-tag-chip [label]="tag" [removable]="true" (remove)="articleService.toggleTag(tag); articleService.loadArticles()" />
          }
          @if (articleService.difficulty(); as diff) {
            <app-tag-chip [label]="diff" [removable]="true" (remove)="clearDifficulty()" />
          }
          <button
            (click)="articleService.clearFilters(); articleService.loadArticles()"
            class="text-sm text-red-600 hover:text-red-800 self-center">
            {{ lang.current() === 'vi' ? 'Xóa tất cả' : 'Clear all' }}
          </button>
        </div>
      }

      <!-- Main grid -->
      <div class="grid lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- Sidebar -->
        @if (showFilters()) {
          <div class="lg:col-span-1 space-y-4">
            <app-filter-panel />
            <app-sidebar />
          </div>
        }

        <!-- Article grid -->
        <main [class]="showFilters() ? 'lg:col-span-3' : 'lg:col-span-4'">
          @if (articleService.loading()) {
            <app-loading-spinner />
          } @else if (articleService.error(); as error) {
            <app-empty-state
              [title]="lang.current() === 'vi' ? 'Lỗi tải dữ liệu' : 'Error loading data'"
              [message]="error" />
          } @else if (articleService.articles().length === 0) {
            <app-empty-state
              [title]="lang.current() === 'vi' ? 'Không tìm thấy bài viết' : 'No articles found'"
              [message]="lang.current() === 'vi' ? 'Thử điều chỉnh bộ lọc' : 'Try adjusting your filters'" />
          } @else {
            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (article of articleService.articles(); track article.slug) {
                <app-article-card [article]="article" />
              }
            </div>

            @if (articleService.totalPages() > 1) {
              <app-pagination
                [currentPage]="articleService.currentPage()"
                [totalPages]="articleService.totalPages()"
                (pageChange)="onPageChange($event)" />
            }
          }
        </main>
      </div>
    </div>
  `,
})
export class ArticleListComponent implements OnInit {
  articleService = inject(ArticleService);
  metadataService = inject(MetadataService);
  lang = inject(LanguageService);
  showFilters = signal(typeof window !== 'undefined' && window.innerWidth >= 1024);

  ngOnInit(): void {
    this.metadataService.loadAllMetadata();
    this.articleService.loadArticles();
  }

  onPageChange(page: number): void {
    this.articleService.setPage(page);
    this.articleService.loadArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearGenre(): void {
    this.articleService.selectedGenre.set(null);
    this.articleService.currentPage.set(1);
    this.articleService.loadArticles();
  }

  clearDifficulty(): void {
    this.articleService.difficulty.set(null);
    this.articleService.currentPage.set(1);
    this.articleService.loadArticles();
  }
}
