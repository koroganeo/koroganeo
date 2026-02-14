import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-2 sm:gap-4">
        <!-- Logo -->
        <a routerLink="/" class="text-lg sm:text-xl font-bold text-blue-600 whitespace-nowrap shrink-0">
          MonsterBox
        </a>

        <!-- Search bar -->
        <div class="flex-1 max-w-xl relative min-w-0">
          <input
            type="search"
            [value]="searchService.searchTerm()"
            (input)="onSearch($event)"
            [placeholder]="languageService.current() === 'vi' ? 'Tìm kiếm...' : 'Search...'"
            class="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            aria-label="Search articles" />

          @if (searchService.isSearching()) {
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }
        </div>

        <!-- Language toggle -->
        <button
          (click)="languageService.toggle()"
          class="px-2.5 sm:px-3 py-2 rounded border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors shrink-0"
          [attr.aria-label]="languageService.current() === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'">
          {{ languageService.current() === 'vi' ? 'EN' : 'VI' }}
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  languageService = inject(LanguageService);
  searchService = inject(SearchService);

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchService.search(input.value);
  }
}
