import { Component, inject } from '@angular/core';
import { ArticleService } from '../../core/services/article.service';
import { MetadataService } from '../../core/services/metadata.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    <aside class="space-y-6">
      <!-- Genres -->
      <div>
        <h3 class="font-semibold text-slate-700 mb-3">
          {{ lang.current() === 'vi' ? 'Thể loại' : 'Genres' }}
        </h3>
        <ul class="space-y-1">
          @for (genre of metadataService.genres(); track genre) {
            <li>
              <button
                (click)="selectGenre(genre)"
                [class.bg-blue-100]="articleService.selectedGenre() === genre"
                [class.text-blue-700]="articleService.selectedGenre() === genre"
                class="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-slate-100 transition-colors flex justify-between items-center">
                <span>{{ genre }}</span>
                <span class="text-xs text-slate-400">{{ metadataService.genreCounts()[genre] || 0 }}</span>
              </button>
            </li>
          }
        </ul>
      </div>

      <!-- Difficulty Levels -->
      <div>
        <h3 class="font-semibold text-slate-700 mb-3">
          {{ lang.current() === 'vi' ? 'Độ khó' : 'Difficulty' }}
        </h3>
        <ul class="space-y-1">
          @for (level of metadataService.difficultyLevels(); track level) {
            <li>
              <button
                (click)="selectDifficulty(level)"
                [class.bg-blue-100]="articleService.difficulty() === level"
                [class.text-blue-700]="articleService.difficulty() === level"
                class="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-slate-100 transition-colors">
                {{ level }}
              </button>
            </li>
          }
        </ul>
      </div>

      <!-- Popular Tags -->
      <div>
        <h3 class="font-semibold text-slate-700 mb-3">
          {{ lang.current() === 'vi' ? 'Thẻ phổ biến' : 'Popular Tags' }}
        </h3>
        <div class="flex flex-wrap gap-2">
          @for (tag of metadataService.tags().slice(0, 20); track tag) {
            <button
              (click)="articleService.toggleTag(tag)"
              [class.bg-amber-200]="articleService.selectedTags().includes(tag)"
              class="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
              {{ tag }}
            </button>
          }
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  articleService = inject(ArticleService);
  metadataService = inject(MetadataService);
  lang = inject(LanguageService);

  selectGenre(genre: string): void {
    if (this.articleService.selectedGenre() === genre) {
      this.articleService.selectedGenre.set(null);
    } else {
      this.articleService.selectedGenre.set(genre);
    }
    this.articleService.currentPage.set(1);
  }

  selectDifficulty(level: string): void {
    if (this.articleService.difficulty() === level) {
      this.articleService.difficulty.set(null);
    } else {
      this.articleService.difficulty.set(level);
    }
    this.articleService.currentPage.set(1);
  }
}
