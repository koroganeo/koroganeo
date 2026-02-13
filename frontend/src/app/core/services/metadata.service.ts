import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MetadataResponse, StatsResponse } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class MetadataService {
  private http = inject(HttpClient);

  genres = signal<string[]>([]);
  genreCounts = signal<Record<string, number>>({});
  tags = signal<string[]>([]);
  tagCounts = signal<Record<string, number>>({});
  creators = signal<string[]>([]);
  creatorCounts = signal<Record<string, number>>({});
  difficultyLevels = signal<string[]>([]);
  stats = signal<StatsResponse | null>(null);

  async loadAllMetadata(): Promise<void> {
    await Promise.all([
      this.loadField('genres'),
      this.loadField('tags'),
      this.loadField('creators'),
      this.loadField('difficultyLevels'),
      this.loadStats(),
    ]);
  }

  private async loadField(field: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<MetadataResponse>('/api/metadata', { params: { field } })
      );

      switch (field) {
        case 'genres':
          this.genres.set(response.values);
          this.genreCounts.set(response.counts);
          break;
        case 'tags':
          this.tags.set(response.values);
          this.tagCounts.set(response.counts);
          break;
        case 'creators':
          this.creators.set(response.values);
          this.creatorCounts.set(response.counts);
          break;
        case 'difficultyLevels':
          this.difficultyLevels.set(response.values);
          break;
      }
    } catch (err) {
      console.error(`Error loading ${field} metadata:`, err);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<StatsResponse>('/api/metadata/stats')
      );
      this.stats.set(response);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }
}
