import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ArticleMetadata, SearchResponse } from '../models/article.model';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  searchTerm = signal('');
  results = signal<ArticleMetadata[]>([]);
  highlights = signal<Record<string, string[]>>({});
  isSearching = signal(false);
  totalResults = signal(0);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim().length < 2) {
          return of(null);
        }
        this.isSearching.set(true);
        return this.http.get<SearchResponse>('/api/search', {
          params: {
            q: term,
            lang: this.languageService.current(),
          },
        });
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          this.results.set(response.results);
          this.highlights.set(response.highlights);
          this.totalResults.set(response.total);
        } else {
          this.results.set([]);
          this.highlights.set({});
          this.totalResults.set(0);
        }
        this.isSearching.set(false);
      },
      error: () => {
        this.isSearching.set(false);
        this.results.set([]);
      },
    });
  }

  search(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  clear(): void {
    this.searchTerm.set('');
    this.results.set([]);
    this.highlights.set({});
    this.totalResults.set(0);
  }
}
