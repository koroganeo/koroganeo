import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'vietnameseDate', standalone: true })
export class VietnameseDatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(value: string | Date, format: 'short' | 'long' = 'long'): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const lang = this.languageService.current();

    if (lang === 'vi') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (format === 'short') {
        return `${day}/${month}/${year}`;
      }
      return `${day} tháng ${month}, ${year}`;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
    });
  }
}
