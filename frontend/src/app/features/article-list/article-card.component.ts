import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleMetadata } from '../../core/models/article.model';
import { LanguageService } from '../../core/services/language.service';
import { TagChipComponent } from '../../shared/components/tag-chip.component';
import { VietnameseDatePipe } from '../../shared/pipes/vietnamese-date.pipe';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink, TagChipComponent, VietnameseDatePipe],
  template: `
    <article class="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <!-- Genre badge -->
      <div class="mb-2">
        <span class="text-xs font-medium text-blue-600 uppercase tracking-wide">
          {{ article().genres }}
        </span>
      </div>

      <!-- Title -->
      <h2 class="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
        <a [routerLink]="['/article', article().slug]" class="hover:text-blue-600 transition-colors">
          {{ lang.current() === 'vi' ? article().titleVi : (article().titleEn || article().titleVi) }}
        </a>
      </h2>

      <!-- Metadata -->
      <div class="flex items-center gap-3 text-sm text-slate-500 mb-3">
        @if (article().creators.length > 0) {
          <span class="flex items-center gap-1">
            <span class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
              {{ article().creators[0].charAt(0) }}
            </span>
            {{ article().creators[0] }}
          </span>
        }
        <span>{{ article().createdAt | vietnameseDate:'short' }}</span>
        @if (article().length) {
          <span>{{ readingTime() }} {{ lang.current() === 'vi' ? 'phút đọc' : 'min read' }}</span>
        }
      </div>

      <!-- Tags -->
      @if (article().tags.length > 0) {
        <div class="flex flex-wrap gap-1.5">
          @for (tag of article().tags.slice(0, 3); track tag) {
            <app-tag-chip [label]="tag" />
          }
          @if (article().tags.length > 3) {
            <span class="text-xs text-slate-400 self-center">+{{ article().tags.length - 3 }}</span>
          }
        </div>
      }
    </article>
  `,
})
export class ArticleCardComponent {
  article = input.required<ArticleMetadata>();
  lang = inject(LanguageService);

  readingTime(): number {
    return Math.max(1, Math.round(this.article().length / 1000));
  }
}
