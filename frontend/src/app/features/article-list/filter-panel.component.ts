import { Component, inject } from '@angular/core';
import { ArticleService } from '../../core/services/article.service';
import { MetadataService } from '../../core/services/metadata.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-slate-700">
          {{ lang.current() === 'vi' ? 'Bộ lọc' : 'Filters' }}
        </h3>
        @if (articleService.hasActiveFilters()) {
          <button
            (click)="articleService.clearFilters(); articleService.loadArticles()"
            class="text-xs text-red-600 hover:text-red-800">
            {{ lang.current() === 'vi' ? 'Xóa tất cả' : 'Clear all' }}
          </button>
        }
      </div>

      <!-- Sort -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-1">
          {{ lang.current() === 'vi' ? 'Sắp xếp' : 'Sort by' }}
        </label>
        <select
          [value]="articleService.sortBy()"
          (change)="onSortChange($event)"
          class="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="date">{{ lang.current() === 'vi' ? 'Ngày tạo' : 'Date' }}</option>
          <option value="title">{{ lang.current() === 'vi' ? 'Tiêu đề' : 'Title' }}</option>
          <option value="length">{{ lang.current() === 'vi' ? 'Độ dài' : 'Length' }}</option>
        </select>
      </div>

      <!-- Sort order -->
      <div>
        <label class="block text-sm font-medium text-slate-600 mb-1">
          {{ lang.current() === 'vi' ? 'Thứ tự' : 'Order' }}
        </label>
        <select
          [value]="articleService.sortOrder()"
          (change)="onSortOrderChange($event)"
          class="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="desc">{{ lang.current() === 'vi' ? 'Giảm dần' : 'Descending' }}</option>
          <option value="asc">{{ lang.current() === 'vi' ? 'Tăng dần' : 'Ascending' }}</option>
        </select>
      </div>
    </div>
  `,
})
export class FilterPanelComponent {
  articleService = inject(ArticleService);
  metadataService = inject(MetadataService);
  lang = inject(LanguageService);

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.articleService.sortBy.set(select.value as 'date' | 'length' | 'title');
    this.articleService.loadArticles();
  }

  onSortOrderChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.articleService.sortOrder.set(select.value as 'asc' | 'desc');
    this.articleService.loadArticles();
  }
}
