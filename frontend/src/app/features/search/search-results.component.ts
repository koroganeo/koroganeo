import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { LanguageService } from '../../core/services/language.service';
import { ArticleCardComponent } from '../article-list/article-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [RouterLink, ArticleCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="container mx-auto px-4 py-6">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">
          {{ lang.current() === 'vi' ? 'Kết quả tìm kiếm' : 'Search Results' }}
        </h1>
        @if (searchService.searchTerm()) {
          <p class="text-sm text-slate-500 mt-1">
            {{ lang.current() === 'vi' ? 'Tìm kiếm:' : 'Searching for:' }}
            "{{ searchService.searchTerm() }}"
            ({{ searchService.totalResults() }} {{ lang.current() === 'vi' ? 'kết quả' : 'results' }})
          </p>
        }
      </header>

      @if (searchService.isSearching()) {
        <app-loading-spinner />
      } @else if (searchService.results().length === 0 && searchService.searchTerm()) {
        <app-empty-state
          [title]="lang.current() === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'"
          [message]="lang.current() === 'vi' ? 'Thử từ khóa khác' : 'Try different keywords'" />
      } @else {
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (article of searchService.results(); track article.slug) {
            <app-article-card [article]="article" />
          }
        </div>
      }

      <div class="mt-8">
        <a routerLink="/" class="text-blue-600 hover:text-blue-800 font-medium">
          &larr; {{ lang.current() === 'vi' ? 'Quay lại danh sách' : 'Back to articles' }}
        </a>
      </div>
    </div>
  `,
})
export class SearchResultsComponent {
  searchService = inject(SearchService);
  lang = inject(LanguageService);
}
