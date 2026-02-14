import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { LanguageService } from '../../core/services/language.service';
import { ArticleMetadata } from '../../core/models/article.model';
import { TagChipComponent } from '../../shared/components/tag-chip.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { VietnameseDatePipe } from '../../shared/pipes/vietnamese-date.pipe';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    RouterLink,
    TagChipComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    SafeHtmlPipe,
    VietnameseDatePipe,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (!article()) {
      <div class="container mx-auto px-4 py-6">
        <app-empty-state
          [title]="lang.current() === 'vi' ? 'Không tìm thấy bài viết' : 'Article not found'"
          [message]="lang.current() === 'vi' ? 'Bài viết không tồn tại hoặc đã bị xóa' : 'The article does not exist or has been removed'" />
      </div>
    } @else {
      <div class="container mx-auto px-4 py-6 max-w-4xl">
        <!-- Breadcrumbs -->
        <nav class="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center gap-2">
            <li><a routerLink="/" class="hover:text-blue-600">{{ lang.current() === 'vi' ? 'Trang chủ' : 'Home' }}</a></li>
            <li class="text-slate-300">/</li>
            <li>{{ article()!.genres }}</li>
            <li class="text-slate-300">/</li>
            <li class="text-slate-700 font-medium truncate max-w-xs">
              {{ lang.current() === 'vi' ? article()!.titleVi : (article()!.titleEn || article()!.titleVi) }}
            </li>
          </ol>
        </nav>

        <!-- Article header -->
        <header class="mb-8">
          <span class="text-sm font-medium text-blue-600 uppercase tracking-wide">
            {{ article()!.genres }}
          </span>
          <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4 leading-tight">
            {{ lang.current() === 'vi' ? article()!.titleVi : (article()!.titleEn || article()!.titleVi) }}
          </h1>

          <!-- Subtitle: show alternate language title -->
          @if (lang.current() === 'vi' && article()!.titleEn) {
            <p class="text-lg text-slate-500 italic mb-4">{{ article()!.titleEn }}</p>
          } @else if (lang.current() === 'en' && article()!.titleVi && article()!.titleEn) {
            <p class="text-lg text-slate-500 italic mb-4">{{ article()!.titleVi }}</p>
          }

          <!-- Metadata -->
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
            @for (creator of article()!.creators; track creator) {
              <span class="flex items-center gap-1.5">
                <span class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                  {{ creator.charAt(0) }}
                </span>
                {{ creator }}
              </span>
            }
            <span>{{ article()!.createdAt | vietnameseDate:lang.current() }}</span>
            @if (article()!.length) {
              <span>{{ readingTime() }} {{ lang.current() === 'vi' ? 'phút đọc' : 'min read' }}</span>
            }
            @if (article()!.difficultyLevel && article()!.difficultyLevel !== 'Không có thông tin') {
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                {{ article()!.difficultyLevel }}
              </span>
            }
          </div>

          <!-- Tags -->
          @if (article()!.tags.length > 0) {
            <div class="flex flex-wrap gap-2">
              @for (tag of article()!.tags; track tag) {
                <a routerLink="/" class="no-underline">
                  <app-tag-chip [label]="tag" />
                </a>
              }
            </div>
          }
        </header>

        <!-- Article content -->
        <div class="article-content prose prose-slate max-w-none" [innerHTML]="content() | safeHtml"></div>

        <!-- Back link -->
        <div class="mt-12 pt-6 border-t border-slate-200">
          <a routerLink="/" class="text-blue-600 hover:text-blue-800 font-medium">
            &larr; {{ lang.current() === 'vi' ? 'Quay lại danh sách' : 'Back to articles' }}
          </a>
        </div>
      </div>
    }
  `,
  styles: [`
    :host ::ng-deep .article-content {
      font-size: 1.0625rem;
      line-height: 1.75;
      color: #1e293b;
    }
    :host ::ng-deep .article-content h1,
    :host ::ng-deep .article-content h2,
    :host ::ng-deep .article-content h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 700;
      color: #0f172a;
    }
    :host ::ng-deep .article-content h1 { font-size: 1.75rem; }
    :host ::ng-deep .article-content h2 { font-size: 1.5rem; }
    :host ::ng-deep .article-content h3 { font-size: 1.25rem; }
    :host ::ng-deep .article-content p { margin-bottom: 1rem; }
    :host ::ng-deep .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
    :host ::ng-deep .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    :host ::ng-deep .article-content table td,
    :host ::ng-deep .article-content table th {
      border: 1px solid #e2e8f0;
      padding: 0.5rem 0.75rem;
    }
    :host ::ng-deep .article-content ul,
    :host ::ng-deep .article-content ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    :host ::ng-deep .article-content blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 1rem;
      color: #475569;
      font-style: italic;
      margin: 1.5rem 0;
    }
  `],
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private articleService = inject(ArticleService);
  lang = inject(LanguageService);

  article = signal<ArticleMetadata | null>(null);
  content = signal('');
  loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.loadArticle(slug);
  }

  private async loadArticle(slug: string): Promise<void> {
    this.loading.set(true);
    const response = await this.articleService.getArticle(slug);
    if (response) {
      this.article.set(response.article);
      this.content.set(response.content);
    }
    this.loading.set(false);
  }

  readingTime(): number {
    const article = this.article();
    if (!article) return 0;
    return Math.max(1, Math.round(article.length / 1000));
  }
}
